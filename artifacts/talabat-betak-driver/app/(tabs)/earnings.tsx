import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  getStorageObject,
  getListDriverDeliveriesQueryKey,
  useCancelManualPayout,
  useGetDriverEarnings,
  useListDriverDeliveries,
  useListManualPayouts,
  useRequestManualPayout,
  type ManualPayoutChannel,
  type ManualPayoutRequest,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/ctx/LocaleContext';
import { formatCurrency, formatDate } from '@/lib/i18n';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const PAYOUT_CHANNELS: ManualPayoutChannel[] = ['instapay', 'mobile_wallet', 'cash_branch'];
const DEFAULT_FEES: Record<ManualPayoutChannel, number> = {
  instapay: 5,
  mobile_wallet: 10,
  cash_branch: 100,
};

type DestinationForm = {
  accountName: string;
  instapayAddress: string;
  mobileNumber: string;
  branch: string;
};

type ProofPreview = {
  uri: string;
  contentType: string;
};

type Confirmation =
  | { kind: 'submit' }
  | { kind: 'cancel'; payoutId: number };

function newIdempotencyKey(): string {
  return `driver-payout-${Date.now().toString()}-${Math.random().toString(36).slice(2, 11)}`;
}

function readPayoutSettings(response: unknown): Record<string, unknown> | null {
  if (!response || typeof response !== 'object') return null;
  const settings = (response as Record<string, unknown>).settings;
  return settings && typeof settings === 'object' ? settings as Record<string, unknown> : null;
}

function readChannelFee(response: unknown, channel: ManualPayoutChannel): number | null {
  const settings = readPayoutSettings(response);
  const channels = settings?.channels;
  if (!channels || typeof channels !== 'object') return null;
  const channelSettings = (channels as Record<string, unknown>)[channel];
  if (!channelSettings || typeof channelSettings !== 'object') return null;
  const fee = (channelSettings as Record<string, unknown>).fee;
  return typeof fee === 'number' && Number.isFinite(fee) && fee >= 0 ? fee : null;
}

function readFeePayer(response: unknown): 'recipient' | 'platform' | null {
  const payer = readPayoutSettings(response)?.defaultFeePayer;
  return payer === 'recipient' || payer === 'platform' ? payer : null;
}

function readApiError(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;
  const candidate = error as { data?: unknown; message?: unknown };
  if (candidate.data && typeof candidate.data === 'object') {
    const data = candidate.data as Record<string, unknown>;
    if (typeof data.error === 'string' && data.error.trim()) return data.error;
    if (data.error && typeof data.error === 'object') {
      const nested = (data.error as Record<string, unknown>).message;
      if (typeof nested === 'string' && nested.trim()) return nested;
    }
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
  }
  if (typeof candidate.message === 'string' && candidate.message.trim() && !candidate.message.startsWith('Network request failed')) {
    return candidate.message;
  }
  return fallback;
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Proof preview is not an image'));
      }
    };
    reader.onerror = () => reject(new Error('Proof preview could not be read'));
    reader.readAsDataURL(blob);
  });
}

export default function EarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, locale, direction } = useLocale();
  const {
    data: earnings,
    isLoading: earningsLoading,
    isError: earningsError,
    refetch: refetchEarnings,
  } = useGetDriverEarnings();
  const {
    data: deliveries,
    isLoading: deliveriesLoading,
    isError: deliveriesError,
    refetch: refetchDeliveries,
  } = useListDriverDeliveries(
    { page: 1, pageSize: 50 },
    { query: { queryKey: getListDriverDeliveriesQueryKey({ page: 1, pageSize: 50 }) } },
  );
  const payoutsQuery = useListManualPayouts();
  const requestPayout = useRequestManualPayout();
  const cancelPayoutRequest = useCancelManualPayout();

  const [isFormVisible, setFormVisible] = useState(false);
  const [channel, setChannel] = useState<ManualPayoutChannel>('instapay');
  const [destination, setDestination] = useState<DestinationForm>({
    accountName: '',
    instapayAddress: '',
    mobileNumber: '',
    branch: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [proofLoadingId, setProofLoadingId] = useState<number | null>(null);
  const [proofPreview, setProofPreview] = useState<ProofPreview | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const submitLock = useRef(false);
  const cancelLock = useRef<number | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const earningsData = earnings as Record<string, unknown> | undefined;
  const deliveryList = (deliveries as { items?: Array<Record<string, unknown>> } | undefined)?.items || [];
  const payoutSummary = payoutsQuery.data?.summary;
  const payoutRequests = payoutsQuery.data?.requests ?? [];
  const available = payoutSummary?.available ?? 0;
  const selectedFee = readChannelFee(payoutsQuery.data, channel) ?? DEFAULT_FEES[channel];
  const feePayer = readFeePayer(payoutsQuery.data) ?? 'recipient';
  const netPreview = feePayer === 'recipient' ? Math.max(0, available - selectedFee) : available;
  const isRefreshing = earningsLoading || deliveriesLoading || payoutsQuery.isLoading;

  const onRefresh = async () => {
    await Promise.all([refetchEarnings(), refetchDeliveries(), payoutsQuery.refetch()]);
  };

  const resetForm = () => {
    setChannel('instapay');
    setDestination({ accountName: '', instapayAddress: '', mobileNumber: '', branch: '' });
    setFormError(null);
    idempotencyKey.current = null;
  };

  const openPayoutForm = () => {
    if (available <= 0) {
      Alert.alert(t('earnings.noAvailable'));
      return;
    }
    resetForm();
    setFormVisible(true);
  };

  const updateDestination = (field: keyof DestinationForm, value: string) => {
    setDestination((current) => ({ ...current, [field]: value }));
    setFormError(null);
  };

  const validateDestination = (): string | null => {
    if (destination.accountName.trim().length < 2) return t('earnings.invalidDestination');
    if (channel === 'instapay' && destination.instapayAddress.trim().length < 3) {
      return t('earnings.invalidDestination');
    }
    if (channel === 'mobile_wallet' && !/^[+]?[0-9 ()-]{8,24}$/.test(destination.mobileNumber.trim())) {
      return t('earnings.invalidDestination');
    }
    if (channel === 'cash_branch' && destination.branch.trim().length < 2) {
      return t('earnings.invalidDestination');
    }
    return null;
  };

  const submitPayout = async () => {
    if (submitLock.current || isSubmitting) return;
    const validationError = validateDestination();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (available <= 0) {
      setFormError(t('earnings.noAvailable'));
      return;
    }
    if (netPreview <= 0) {
      setFormError(t('earnings.zeroNet'));
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    const key = idempotencyKey.current ?? newIdempotencyKey();
    idempotencyKey.current = key;
    const requestDestination = {
      accountName: destination.accountName.trim(),
      ...(channel === 'instapay' ? { instapayAddress: destination.instapayAddress.trim() } : {}),
      ...(channel === 'mobile_wallet' ? { mobileNumber: destination.mobileNumber.trim() } : {}),
      ...(channel === 'cash_branch' ? { branch: destination.branch.trim() } : {}),
    };

    try {
      const created = await requestPayout.mutateAsync({
        data: {
          channel,
          destination: requestDestination,
          idempotencyKey: key,
        },
      });
      await Promise.all([payoutsQuery.refetch(), refetchEarnings()]);
      setFormVisible(false);
      resetForm();
      Alert.alert(
        t('earnings.payoutRequested'),
        `${t('earnings.net')}: ${formatCurrency(locale, created.netAmount)}\n${t('earnings.fee')}: ${formatCurrency(locale, created.feeAmount)}`,
      );
    } catch (error) {
      setFormError(readApiError(error, t('earnings.payoutRequestError')));
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  const confirmPayout = () => {
    const validationError = validateDestination();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (netPreview <= 0) {
      setFormError(t('earnings.zeroNet'));
      return;
    }
    if (Platform.OS === 'web') {
      setConfirmation({ kind: 'submit' });
      return;
    }
    Alert.alert(
      t('earnings.confirmTitle'),
      t('earnings.confirmBody', { amount: formatCurrency(locale, netPreview) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('earnings.confirm'), onPress: () => { void submitPayout(); } },
      ],
    );
  };

  const cancelPayout = async (payoutId: number) => {
    if (cancelLock.current === payoutId || cancellingId !== null) return;
    cancelLock.current = payoutId;
    setCancellingId(payoutId);
    try {
      await cancelPayoutRequest.mutateAsync({ id: payoutId });
      await payoutsQuery.refetch();
    } catch (error) {
      Alert.alert(t('common.error'), readApiError(error, t('earnings.payoutCancelError')));
    } finally {
      setCancellingId(null);
      cancelLock.current = null;
    }
  };

  const confirmCancel = (payoutId: number) => {
    if (Platform.OS === 'web') {
      setConfirmation({ kind: 'cancel', payoutId });
      return;
    }
    Alert.alert(
      t('earnings.cancelPayoutTitle'),
      t('earnings.cancelPayoutBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('earnings.cancelPayout'),
          style: 'destructive',
          onPress: () => { void cancelPayout(payoutId); },
        },
      ],
    );
  };

  const resolveConfirmation = () => {
    const action = confirmation;
    setConfirmation(null);
    if (!action) return;
    if (action.kind === 'submit') {
      void submitPayout();
    } else {
      void cancelPayout(action.payoutId);
    }
  };

  const viewProof = async (payout: ManualPayoutRequest) => {
    const proof = payout.proof;
    if (
      !proof ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(proof.contentType) ||
      !/^\/objects\/[A-Za-z0-9._/-]+$/.test(proof.objectPath) ||
      proof.objectPath.includes('..')
    ) {
      Alert.alert(t('common.error'), t('earnings.proofUnavailable'));
      return;
    }
    setProofLoadingId(payout.id);
    try {
      // The generated storage route expects the path below /objects/, while
      // payout proof metadata intentionally keeps its private /objects/ path.
      const pathBelowObjects = proof.objectPath.replace(/^\/objects\//, '');
      const blob = await getStorageObject(pathBelowObjects, { responseType: 'blob' });
      const uri = await blobToDataUri(blob);
      setProofPreview({ uri, contentType: proof.contentType });
    } catch {
      Alert.alert(t('common.error'), t('earnings.proofLoadError'));
    } finally {
      setProofLoadingId(null);
    }
  };

  const renderPayoutCard = (payout: ManualPayoutRequest) => {
    const destinationValue =
      payout.channel === 'instapay'
        ? payout.destination.instapayAddress
        : payout.channel === 'mobile_wallet'
          ? payout.destination.mobileNumber
          : payout.destination.branch;
    const isPending = payout.status === 'pending';
    const statusColor =
      payout.status === 'paid' || payout.status === 'approved'
        ? colors.success
        : payout.status === 'rejected' || payout.status === 'cancelled'
          ? colors.destructive
          : colors.accentForeground;

    return (
      <View key={payout.id} style={[styles.payoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.payoutCardHeader}>
          <View style={styles.payoutCardTitle}>
            <Feather name="send" size={18} color={colors.primary} />
            <Text style={[styles.payoutChannel, { color: colors.foreground }]}>
              {t(`earnings.channel.${payout.channel}`)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {t(`earnings.payoutStatus.${payout.status}`)}
            </Text>
          </View>
        </View>
        <Text style={[styles.payoutDate, { color: colors.mutedForeground }]}>
          {formatDate(locale, payout.createdAt)}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.payoutAmountRow}>
          <View style={styles.payoutAmount}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{t('earnings.gross')}</Text>
            <Text style={[styles.amountText, { color: colors.foreground }]}>
              {formatCurrency(locale, payout.grossAmount)}
            </Text>
          </View>
          <View style={styles.payoutAmount}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{t('earnings.net')}</Text>
            <Text style={[styles.amountText, { color: colors.success }]}>
              {formatCurrency(locale, payout.netAmount)}
            </Text>
          </View>
        </View>
        <Text style={[styles.destinationText, { color: colors.mutedForeground }]} numberOfLines={1}>
          {payout.destination.accountName} · {destinationValue}
        </Text>
        {payout.rejectionReason ? (
          <Text style={[styles.rejectionText, { color: colors.destructive }]}>{payout.rejectionReason}</Text>
        ) : null}
        <View style={styles.payoutActions}>
          {payout.proof ? (
            <Pressable
              onPress={() => { void viewProof(payout); }}
              disabled={proofLoadingId === payout.id}
              style={styles.proofButton}
              accessibilityRole="button"
              accessibilityLabel={t('earnings.viewProof')}
              testID={`payout-proof-${payout.id}`}
            >
              {proofLoadingId === payout.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Feather name="image" size={16} color={colors.primary} />
              )}
              <Text style={[styles.proofButtonText, { color: colors.primary }]}>{t('earnings.viewProof')}</Text>
            </Pressable>
          ) : null}
          {isPending ? (
            <Pressable
              onPress={() => confirmCancel(payout.id)}
              disabled={cancellingId === payout.id}
              style={[styles.cancelButton, { borderColor: colors.destructive }]}
              accessibilityRole="button"
              accessibilityLabel={t('earnings.cancelPayout')}
              testID={`cancel-payout-${payout.id}`}
            >
              {cancellingId === payout.id ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : null}
              <Text style={[styles.cancelButtonText, { color: colors.destructive }]}>{t('earnings.cancelPayout')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const renderPayoutSection = () => {
    const pending = payoutRequests.filter((payout) => payout.status === 'pending');
    const history = payoutRequests.filter((payout) => payout.status !== 'pending');

    return (
      <View style={styles.payoutSection}>
        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('earnings.payouts')}</Text>
          <Feather name="credit-card" size={20} color={colors.primary} />
        </View>
        {payoutsQuery.isError ? (
          <View style={[styles.inlineError, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inlineErrorText, { color: colors.destructive }]} accessibilityRole="alert">
              {t('common.loadError')}
            </Text>
            <Pressable onPress={() => { void payoutsQuery.refetch(); }} accessibilityRole="button">
              <Text style={[styles.retryText, { color: colors.primary }]}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
              <View style={styles.balanceTopRow}>
                <View>
                  <Text style={[styles.balanceLabel, { color: colors.primaryForeground }]}>{t('earnings.available')}</Text>
                  <Text style={[styles.balanceValue, { color: colors.primaryForeground }]}>
                    {formatCurrency(locale, payoutSummary?.available)}
                  </Text>
                </View>
                <Feather name="arrow-down-circle" size={30} color={colors.primaryForeground} />
              </View>
              <View style={styles.balanceStats}>
                <View style={styles.balanceStat}>
                  <Text style={[styles.balanceStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('earnings.reserved')}</Text>
                  <Text style={[styles.balanceStatValue, { color: colors.primaryForeground }]}>
                    {formatCurrency(locale, payoutSummary?.reserved)}
                  </Text>
                </View>
                <View style={styles.balanceStat}>
                  <Text style={[styles.balanceStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('earnings.paid')}</Text>
                  <Text style={[styles.balanceStatValue, { color: colors.primaryForeground }]}>
                    {formatCurrency(locale, payoutSummary?.paid)}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={openPayoutForm}
              disabled={payoutsQuery.isLoading || available <= 0}
              style={[
                styles.withdrawButton,
                {
                  backgroundColor: available > 0 ? colors.accent : colors.muted,
                  opacity: payoutsQuery.isLoading ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('earnings.withdraw')}
              testID="withdraw-earnings-button"
            >
              <Feather name="download" size={19} color={available > 0 ? colors.accentForeground : colors.mutedForeground} />
              <Text style={[styles.withdrawButtonText, { color: available > 0 ? colors.accentForeground : colors.mutedForeground }]}>
                {available > 0 ? t('earnings.withdraw') : t('earnings.noAvailable')}
              </Text>
            </Pressable>
            {pending.length > 0 ? (
              <>
                <Text style={[styles.subsectionTitle, { color: colors.foreground }]}>{t('earnings.pendingPayouts')}</Text>
                {pending.map(renderPayoutCard)}
              </>
            ) : null}
            <Text style={[styles.subsectionTitle, { color: colors.foreground }]}>{t('earnings.payoutHistory')}</Text>
            {history.length > 0 ? history.map(renderPayoutCard) : (
              <Text style={[styles.noPayouts, { color: colors.mutedForeground }]}>{t('earnings.noPayouts')}</Text>
            )}
          </>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {renderPayoutSection()}
      <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.summaryLabel, { color: colors.primaryForeground }]}>{t('earnings.thisWeek')}</Text>
        <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>
          {formatCurrency(locale, typeof earningsData?.weeklyTotal === 'number' ? earningsData.weeklyTotal : 0)}
        </Text>
        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('earnings.deliveries')}</Text>
            <Text style={[styles.summaryStatValue, { color: colors.primaryForeground }]}>
              {typeof earningsData?.weeklyCount === 'number' ? earningsData.weeklyCount : 0}
            </Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('earnings.onlineHours')}</Text>
            <Text style={[styles.summaryStatValue, { color: colors.primaryForeground }]}>
              {t('earnings.hours', { hours: typeof earningsData?.weeklyHours === 'number' ? earningsData.weeklyHours.toFixed(1) : '0.0' })}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('earnings.recent')}</Text>
    </View>
  );

  const renderEmpty = () => {
    if (deliveriesLoading) {
      return <View style={styles.emptyContainer}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }
    if (earningsError || deliveriesError) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={colors.mutedForeground} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]} accessibilityRole="alert">{t('common.loadError')}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Feather name="file-text" size={48} color={colors.mutedForeground} style={styles.emptyIcon} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('earnings.noRecent')}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Record<string, unknown> }) => (
    <View style={[styles.deliveryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.deliveryHeader}>
        <View>
          <Text style={[styles.deliveryCode, { color: colors.foreground }]}>#{String(item.code ?? '')}</Text>
          <Text style={[styles.deliveryDate, { color: colors.mutedForeground }]}>{formatDate(locale, String(item.createdAt ?? ''))}</Text>
        </View>
        <Text style={[styles.deliveryAmount, { color: colors.foreground }]}>
          {formatCurrency(locale, typeof item.deliveryFee === 'number' ? item.deliveryFee : 0)}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.deliveryLocations}>
        <View style={styles.locationItem}>
          <Feather name="circle" size={12} color={colors.mutedForeground} />
          <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {String(item.restaurantName ?? '')}
          </Text>
        </View>
        <View style={styles.locationItem}>
          <Feather name="map-pin" size={12} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.foreground }]} numberOfLines={1}>
            {String(item.deliveryAddressText ?? t('earnings.customer'))}
          </Text>
        </View>
      </View>
    </View>
  );

  const modalTopPadding = Platform.OS === 'web' ? 16 : insets.top;
  const modalBottomPadding = insets.bottom + (Platform.OS === 'web' ? 34 : 16);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, direction }]}>
      <View style={[
        styles.header,
        {
          paddingTop: Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top,
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
          {t('tabs.earnings')}
        </Text>
      </View>
      <FlatList
        data={deliveryList}
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100, direction },
        ]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={isFormVisible} animationType="slide" transparent onRequestClose={() => { if (!isSubmitting) setFormVisible(false); }}>
        <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.38)' }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, paddingTop: modalTopPadding }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('earnings.withdrawTitle')}</Text>
              <Pressable
                onPress={() => setFormVisible(false)}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                testID="close-withdraw-form"
              >
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>
            <KeyboardAwareScrollViewCompat
              contentContainerStyle={[styles.formContent, { paddingBottom: modalBottomPadding, direction }]}
              bottomOffset={80}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.formIntro, { color: colors.mutedForeground }]}>{t('earnings.destination')}</Text>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>{t('earnings.channel')}</Text>
              <View style={styles.channelRow}>
                {PAYOUT_CHANNELS.map((option) => {
                  const selected = option === channel;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => { setChannel(option); setFormError(null); }}
                      style={[
                        styles.channelButton,
                        {
                          backgroundColor: selected ? colors.primary : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      testID={`payout-channel-${option}`}
                    >
                      <Text style={[styles.channelButtonText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                        {t(`earnings.channel.${option}`)}
                      </Text>
                      <Text style={[styles.channelFeeText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
                        {formatCurrency(locale, readChannelFee(payoutsQuery.data, option) ?? DEFAULT_FEES[option])}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.feeSource, { color: colors.mutedForeground }]}>{t('earnings.serverFee')}</Text>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>{t('earnings.accountName')}</Text>
              <TextInput
                value={destination.accountName}
                onChangeText={(value) => updateDestination('accountName', value)}
                placeholder={t('earnings.accountNamePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, textAlign: direction === 'rtl' ? 'right' : 'left' }]}
                autoCapitalize="words"
                maxLength={120}
                testID="payout-account-name"
              />
              {channel === 'instapay' ? (
                <>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>{t('earnings.instapayAddress')}</Text>
                  <TextInput
                    value={destination.instapayAddress}
                    onChangeText={(value) => updateDestination('instapayAddress', value)}
                    placeholder={t('earnings.instapayPlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, textAlign: 'left' }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={200}
                    testID="payout-instapay-address"
                  />
                </>
              ) : null}
              {channel === 'mobile_wallet' ? (
                <>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>{t('earnings.mobileNumber')}</Text>
                  <TextInput
                    value={destination.mobileNumber}
                    onChangeText={(value) => updateDestination('mobileNumber', value)}
                    placeholder={t('earnings.mobilePlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, textAlign: 'left' }]}
                    keyboardType="phone-pad"
                    maxLength={24}
                    testID="payout-mobile-number"
                  />
                </>
              ) : null}
              {channel === 'cash_branch' ? (
                <>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>{t('earnings.branch')}</Text>
                  <TextInput
                    value={destination.branch}
                    onChangeText={(value) => updateDestination('branch', value)}
                    placeholder={t('earnings.branchPlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, textAlign: direction === 'rtl' ? 'right' : 'left' }]}
                    maxLength={160}
                    testID="payout-branch"
                  />
                </>
              ) : null}
              <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.previewTitle, { color: colors.foreground }]}>{t('earnings.preview')}</Text>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>{t('earnings.gross')}</Text>
                  <Text style={[styles.previewValue, { color: colors.foreground }]}>{formatCurrency(locale, available)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>{t('earnings.fee')}</Text>
                  <Text style={[styles.previewValue, { color: colors.foreground }]}>{formatCurrency(locale, selectedFee)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>{t('earnings.feePayer')}</Text>
                  <Text style={[styles.previewValue, { color: colors.foreground }]}>
                    {t(feePayer === 'recipient' ? 'earnings.recipientPays' : 'earnings.platformPays')}
                  </Text>
                </View>
                <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
                <View style={styles.previewRow}>
                  <Text style={[styles.previewNetLabel, { color: colors.foreground }]}>{t('earnings.net')}</Text>
                  <Text style={[styles.previewNetValue, { color: netPreview > 0 ? colors.success : colors.destructive }]}>
                    {formatCurrency(locale, netPreview)}
                  </Text>
                </View>
              </View>
              {netPreview <= 0 ? (
                <Text style={[styles.formError, { color: colors.destructive }]} accessibilityRole="alert">
                  {t('earnings.zeroNet')}
                </Text>
              ) : null}
              {formError ? (
                <Text style={[styles.formError, { color: colors.destructive }]} accessibilityRole="alert">{formError}</Text>
              ) : null}
              <Pressable
                onPress={confirmPayout}
                disabled={isSubmitting || netPreview <= 0}
                style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isSubmitting || netPreview <= 0 ? 0.55 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={t('earnings.confirm')}
                testID="confirm-withdrawal-button"
              >
                {isSubmitting ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="check" size={19} color={colors.primaryForeground} />}
                <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>{t('earnings.confirm')}</Text>
              </Pressable>
            </KeyboardAwareScrollViewCompat>
          </View>
        </View>
      </Modal>

      <Modal visible={proofPreview !== null} animationType="fade" transparent onRequestClose={() => setProofPreview(null)}>
        <View style={[styles.proofBackdrop, { backgroundColor: 'rgba(0,0,0,0.82)' }]}>
          <View style={[styles.proofCard, { backgroundColor: colors.card }]}>
            {proofPreview ? (
              <Image source={{ uri: proofPreview.uri }} style={styles.proofImage} resizeMode="contain" accessibilityLabel={t('earnings.proof')} />
            ) : null}
            <Pressable
              onPress={() => setProofPreview(null)}
              style={[styles.proofClose, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Feather name="x" size={20} color={colors.primaryForeground} />
              <Text style={[styles.proofCloseText, { color: colors.primaryForeground }]}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmation !== null} animationType="fade" transparent onRequestClose={() => setConfirmation(null)}>
        <View style={[styles.confirmationBackdrop, { backgroundColor: 'rgba(0,0,0,0.38)' }]}>
          <View style={[styles.confirmationCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmationTitle, { color: colors.foreground }]}>
              {confirmation?.kind === 'cancel' ? t('earnings.cancelPayoutTitle') : t('earnings.confirmTitle')}
            </Text>
            <Text style={[styles.confirmationBody, { color: colors.mutedForeground }]}>
              {confirmation?.kind === 'cancel'
                ? t('earnings.cancelPayoutBody')
                : t('earnings.confirmBody', { amount: formatCurrency(locale, netPreview) })}
            </Text>
            <View style={styles.confirmationActions}>
              <Pressable
                onPress={() => setConfirmation(null)}
                style={[styles.confirmationCancel, { borderColor: colors.border }]}
                accessibilityRole="button"
              >
                <Text style={[styles.confirmationCancelText, { color: colors.foreground }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={resolveConfirmation}
                style={[styles.confirmationConfirm, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
              >
                <Text style={[styles.confirmationConfirmText, { color: colors.primaryForeground }]}>
                  {confirmation?.kind === 'cancel' ? t('earnings.cancelPayout') : t('earnings.confirm')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  headerContainer: { marginBottom: 16 },
  payoutSection: { gap: 12, marginBottom: 24 },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    opacity: 0.85,
  },
  balanceValue: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    marginTop: 6,
  },
  balanceStats: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    marginTop: 18,
    paddingTop: 14,
  },
  balanceStat: { flex: 1 },
  balanceStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  balanceStatValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  withdrawButton: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  withdrawButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  inlineError: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  inlineErrorText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  payoutCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  payoutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  payoutCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  payoutChannel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  payoutDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  payoutAmountRow: {
    flexDirection: 'row',
    gap: 20,
  },
  payoutAmount: { flex: 1 },
  metaLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  amountText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginTop: 3,
  },
  destinationText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  rejectionText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  payoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  proofButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  proofButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  cancelButton: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cancelButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  noPayouts: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 6,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    marginBottom: 24,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  summaryStat: { flex: 1 },
  summaryStatLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: { marginBottom: 16 },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  deliveryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deliveryCode: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  deliveryDate: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  deliveryAmount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  deliveryLocations: { gap: 8 },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '94%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  formContent: {
    paddingHorizontal: 20,
    gap: 9,
  },
  formIntro: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 6,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelButton: {
    flex: 1,
    minHeight: 70,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelButtonText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  channelFeeText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 3,
  },
  feeSource: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginTop: 8,
    gap: 9,
  },
  previewTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  previewLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  previewValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'right',
  },
  previewDivider: { height: 1, marginVertical: 2 },
  previewNetLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  previewNetValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  formError: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 3,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  proofBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  proofCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },
  proofImage: {
    width: '100%',
    height: 420,
  },
  proofClose: {
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 18,
    marginTop: 8,
  },
  proofCloseText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  confirmationBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 20,
  },
  confirmationTitle: {
    fontSize: 19,
    fontFamily: 'Inter_700Bold',
  },
  confirmationBody: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Inter_400Regular',
    marginTop: 9,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  confirmationCancel: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationCancelText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  confirmationConfirm: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationConfirmText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});