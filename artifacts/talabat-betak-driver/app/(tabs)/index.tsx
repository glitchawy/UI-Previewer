import React, { useEffect } from 'react';
import { Alert, StyleSheet, View, Text, Switch, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTracking } from '@/ctx/TrackingContext';
import { useGetDriverAccount, useGetAvailableDriverOrder, useGetActiveDriverOrder, getGetAvailableDriverOrderQueryKey, getGetActiveDriverOrderQueryKey } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocale } from '@/ctx/LocaleContext';
import { statusLabel } from '@/lib/i18n';

export default function StatusScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isOnline, toggleOnline, locationError, dispatchUpdatedAt, refreshDispatchLocation } = useTracking();
  const { t, locale, direction } = useLocale();
  
  const { data: account, refetch: refetchAccount, isLoading: accountLoading, isError: accountError } = useGetDriverAccount();
  const { data: offer, refetch: refetchOffer, isError: offerError } = useGetAvailableDriverOrder({
    query: {
      enabled: isOnline,
      refetchInterval: 10000,
      queryKey: getGetAvailableDriverOrderQueryKey(),
    }
  });
  const { data: activeOrder, refetch: refetchActive, isError: activeError } = useGetActiveDriverOrder({
    query: {
      enabled: isOnline,
      refetchInterval: 15000,
      queryKey: getGetActiveDriverOrderQueryKey(),
    }
  });

  const isRefreshing = accountLoading;
  const onRefresh = async () => {
    await Promise.all([refetchAccount(), refetchOffer(), refetchActive()]);
  };
  const handleToggleOnline = async (online: boolean) => {
    try {
      await toggleOnline(online);
    } catch {
      Alert.alert(t('common.error'), t('status.onlineError'));
    }
  };

  // Check if we have an offer or active order and provide quick jump
  const driverState = account as any;

  return (
      <View style={[styles.container, { backgroundColor: colors.background, direction }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('status.title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100, direction }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t('status.availability')}</Text>
            <View style={[styles.statusBadge, { direction }]}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.success : colors.mutedForeground }]} />
              <Text style={[styles.statusText, { color: isOnline ? colors.success : colors.mutedForeground }]}>
                {isOnline ? t('status.online') : t('status.offline')}
              </Text>
            </View>
          </View>
          
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
              {isOnline ? t('status.receivingOrders') : t('status.goOnline')}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              accessibilityRole="switch"
              accessibilityLabel={isOnline ? t('status.online') : t('status.offline')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
              testID="online-toggle"
            />
          </View>
        </View>
        {locationError ? (
          <Text style={{ color: colors.destructive }} accessibilityRole="alert">{locationError}</Text>
        ) : null}
        {(accountError || offerError || activeError) ? (
          <Text style={{ color: colors.destructive }} accessibilityRole="alert">{t('common.loadError')}</Text>
        ) : null}
        {isOnline && !activeOrder ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t('status.dispatchLocation')}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {locationError ? t('status.locationUpdateFailed') : dispatchUpdatedAt &&
                Date.now() - dispatchUpdatedAt < 120_000 ? t('status.locationUpdated') : t('status.locationNeedsUpdate')}
            </Text>
            <TouchableOpacity
              onPress={() => void refreshDispatchLocation()}
              accessibilityRole="button"
              accessibilityLabel={t('status.updateDispatchLocation')}
              style={{ marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: colors.primary }}
            >
              <Text style={{ color: colors.primaryForeground, textAlign: 'center' }}>{t('status.updateDispatchLocation')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{driverState?.completedToday || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('status.completedToday')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="star" size={24} color={colors.accentForeground} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{driverState?.rating?.toFixed(1) || t('status.notAvailable')}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('status.rating')}</Text>
          </View>
        </View>

        {isOnline && (offer || activeOrder) ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('status.currentWorkload')}</Text>
            
            {offer && (
              <View style={[styles.workloadItem, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                <View style={styles.workloadIcon}>
                  <Feather name="bell" size={24} color={colors.accentForeground} />
                </View>
                <View style={styles.workloadInfo}>
                  <Text style={[styles.workloadTitle, { color: colors.accentForeground }]}>{t('status.newOffer')}</Text>
                  <Text style={[styles.workloadSub, { color: colors.accentForeground }]}>{t('status.expiringSoon')}</Text>
                </View>
                <Text
                  style={[styles.actionLink, { color: colors.accentForeground }]} 
                  onPress={() => router.push('/(tabs)/offers')}
                  accessibilityRole="link"
                  accessibilityLabel={t('common.view')}
                >
                  {t('common.view')}
                </Text>
              </View>
            )}

            {activeOrder && (
              <View style={[styles.workloadItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.workloadIcon}>
                  <Feather name="map-pin" size={24} color={colors.primary} />
                </View>
                <View style={styles.workloadInfo}>
                  <Text style={[styles.workloadTitle, { color: colors.foreground }]}>{t('status.activeDelivery')}</Text>
                  <Text style={[styles.workloadSub, { color: colors.mutedForeground }]}>
                    {statusLabel(locale, (activeOrder as any)?.status || 'in_progress')}
                  </Text>
                </View>
                <Text
                  style={[styles.actionLink, { color: colors.primary }]} 
                  onPress={() => router.push('/(tabs)/delivery')}
                  accessibilityRole="link"
                  accessibilityLabel={t('common.view')}
                >
                  {t('common.view')}
                </Text>
              </View>
            )}
          </View>
        ) : isOnline ? (
          <View style={styles.emptyState}>
            <Feather name="coffee" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>{t('status.waitingOrders')}</Text>
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginEnd: 6,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  workloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  workloadIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 16,
  },
  workloadInfo: {
    flex: 1,
  },
  workloadTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  workloadSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  actionLink: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
});
