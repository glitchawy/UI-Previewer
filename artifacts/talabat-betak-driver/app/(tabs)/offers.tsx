import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTracking } from '@/ctx/TrackingContext';
import { useGetAvailableDriverOrder, useAcceptDriverOrder, useRejectDriverOrder, DriverOrderOffer, getGetAvailableDriverOrderQueryKey } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function OffersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isOnline } = useTracking();
  
  const { data: offer, isLoading: isOfferLoading, refetch } = useGetAvailableDriverOrder({
    query: {
      enabled: isOnline,
      refetchInterval: 5000, // Poll more frequently for offers
      queryKey: getGetAvailableDriverOrderQueryKey(),
    }
  });

  const acceptOffer = useAcceptDriverOrder();
  const rejectOffer = useRejectDriverOrder();
  const actionLock = useRef(false);
  const [actionLocked, setActionLocked] = useState(false);
  const authoritativeOfferKey = offer ? `${offer.id}:${offer.offerId}` : null;
  const previousOfferKey = useRef(authoritativeOfferKey);
  useEffect(() => {
    if (previousOfferKey.current !== authoritativeOfferKey) {
      previousOfferKey.current = authoritativeOfferKey;
      actionLock.current = false;
      setActionLocked(false);
    }
  }, [authoritativeOfferKey]);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!offer) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0,
      Math.ceil((new Date(offer.expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [offer]);

  const handleAccept = async () => {
    if (!offer || actionLock.current) return;
    actionLock.current = true;
    setActionLocked(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await acceptOffer.mutateAsync({ id: offer.id });
      router.push('/(tabs)/delivery');
    } catch (e) {
      actionLock.current = false;
      setActionLocked(false);
      console.error(e);
      refetch();
    }
  };

  const handleReject = async () => {
    if (!offer || actionLock.current) return;
    actionLock.current = true;
    setActionLocked(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await rejectOffer.mutateAsync({ id: offer.id });
      await refetch();
    } catch (e) {
      actionLock.current = false;
      setActionLocked(false);
      console.error(e);
      refetch();
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} EGP`;
  };

  if (!isOnline) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Feather name="moon" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: colors.foreground }]}>You are Offline</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Go online from the Status tab to receive delivery offers.
          </Text>
        </View>
      </View>
    );
  }

  if (isOfferLoading && !offer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Feather name="search" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: colors.foreground }]}>No Offers Yet</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            We'll notify you as soon as a new delivery is available in your area.
          </Text>
        </View>
      </View>
    );
  }

  const typedOffer = offer as DriverOrderOffer;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Delivery</Text>
        <View style={[styles.timeBadge, { backgroundColor: colors.destructive }]}>
          <Text style={[styles.timeText, { color: colors.destructiveForeground }]}>
            ينتهي خلال {remaining} ث
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.muted }]}>
          <Feather name="map" size={48} color={colors.mutedForeground} />
          <Text style={[styles.mapText, { color: colors.mutedForeground }]}>Map Preview</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.earningRow}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Estimated Earnings</Text>
              <Text style={[styles.earningAmount, { color: colors.primary }]}>{formatCurrency(typedOffer.deliveryFee || 0)}</Text>
            </View>
            <View style={styles.distanceBadge}>
              <Feather name="navigation" size={16} color={colors.foreground} />
              <Text style={[styles.distanceText, { color: colors.foreground }]}>{typedOffer.distanceKm?.toFixed(1)} km</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.locationRow}>
            <View style={styles.locationIconWrapper}>
              <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <View style={[styles.square, { backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.locationDetails}>
              <View style={styles.locationItem}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Pickup</Text>
                <Text style={[styles.locationName, { color: colors.foreground }]} numberOfLines={1}>{typedOffer.restaurantName}</Text>
              </View>
              <View style={styles.locationItem}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Dropoff</Text>
                <Text style={[styles.locationName, { color: colors.foreground }]} numberOfLines={2}>{typedOffer.deliveryAddressText}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 90, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={handleReject}
            disabled={actionLocked || rejectOffer.isPending || acceptOffer.isPending}
            testID="reject-offer-button"
          >
            {rejectOffer.isPending ? (
              <ActivityIndicator color={colors.foreground} />
            ) : (
              <Feather name="x" size={24} color={colors.foreground} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
            onPress={handleAccept}
            disabled={actionLocked || rejectOffer.isPending || acceptOffer.isPending}
            testID="accept-offer-button"
          >
            {acceptOffer.isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Text style={[styles.acceptText, { color: colors.primaryForeground }]}>Accept Delivery</Text>
                <Feather name="check" size={24} color={colors.primaryForeground} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    padding: 16,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapText: {
    marginTop: 8,
    fontFamily: 'Inter_500Medium',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  earningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  earningAmount: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  distanceText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  locationRow: {
    flexDirection: 'row',
  },
  locationIconWrapper: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  square: {
    width: 12,
    height: 12,
  },
  locationDetails: {
    flex: 1,
    gap: 24,
  },
  locationItem: {
    justifyContent: 'center',
  },
  locationName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  acceptText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
});
