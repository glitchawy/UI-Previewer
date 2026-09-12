import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGetActiveDriverOrder, useUpdateDriverOrderStatus, getGetActiveDriverOrderQueryKey, DriverActiveOrder, DriverOrderStatusUpdateStatus } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocale } from '@/ctx/LocaleContext';
import { formatCurrency, statusLabel } from '@/lib/i18n';

export default function DeliveryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, locale, direction } = useLocale();
  
  const { data: activeOrder, isLoading, isError: activeOrderError, refetch } = useGetActiveDriverOrder({
    query: {
      refetchInterval: 15000,
      queryKey: getGetActiveDriverOrderQueryKey(),
    }
  });

  const updateStatus = useUpdateDriverOrderStatus();
  const statusActionLock = useRef(false);
  const [statusActionLocked, setStatusActionLocked] = useState(false);
  const authoritativeStatusKey = activeOrder ? `${activeOrder.id}:${activeOrder.status}` : null;
  const previousStatusKey = useRef(authoritativeStatusKey);
  useEffect(() => {
    if (previousStatusKey.current !== authoritativeStatusKey) {
      previousStatusKey.current = authoritativeStatusKey;
      statusActionLock.current = false;
      setStatusActionLocked(false);
    }
  }, [authoritativeStatusKey]);

  const handleUpdateStatus = async (status: DriverOrderStatusUpdateStatus) => {
    if (!activeOrder || statusActionLock.current) return;
    statusActionLock.current = true;
    setStatusActionLocked(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await updateStatus.mutateAsync({
        id: activeOrder.id,
        data: { status }
      });
      await refetch();
    } catch (e) {
      setStatusActionLocked(false);
      statusActionLock.current = false;
      Alert.alert(t('common.error'), t('delivery.updateError'));
      await refetch();
    }
  };

  const openMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const openPhone = (phone: string | null | undefined) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  if (isLoading && !activeOrder) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center', direction }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!activeOrder) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, direction }]}>
        <View style={styles.centerContent}>
          <Feather name="check-circle" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: colors.foreground }]}>{activeOrderError ? t('common.error') : t('delivery.noActiveTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {activeOrderError ? t('common.loadError') : t('delivery.noActiveBody')}
          </Text>
        </View>
      </View>
    );
  }

  const order = activeOrder as DriverActiveOrder;
  const isPickedUp = order.status === 'picked_up';
  const destinationLat = isPickedUp ? order.deliveryLat : order.pickupLat;
  const destinationLng = isPickedUp ? order.deliveryLng : order.pickupLng;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background, direction }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('delivery.order', { code: order.code })}</Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.statusText, { color: colors.accentForeground }]}>
            {statusLabel(locale, order.status)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120, direction }]}>
        
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="map-pin" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {isPickedUp ? t('delivery.deliverTo') : t('delivery.pickupFrom')}
            </Text>
          </View>
          
          <Text style={[styles.locationName, { color: colors.foreground }]}>
            {isPickedUp ? (order.customerName || t('delivery.customer')) : order.restaurantName}
          </Text>
          
          <Text style={[styles.addressText, { color: colors.mutedForeground }]}>
            {isPickedUp ? order.deliveryAddressText : (order.pickupAddressText || t('delivery.restaurantAddress'))}
          </Text>
          
          {isPickedUp && order.notes && (
            <View style={[styles.notesBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Text style={[styles.notesLabel, { color: colors.accentForeground }]}>{t('delivery.notes')}</Text>
              <Text style={[styles.notesText, { color: colors.accentForeground }]}>{order.notes}</Text>
            </View>
          )}

          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
              onPress={() => {
                if (destinationLat != null && destinationLng != null) openMaps(destinationLat, destinationLng);
              }}
              disabled={destinationLat == null || destinationLng == null}
              accessibilityRole="button"
              accessibilityLabel={t('delivery.navigate')}
            >
              <Feather name="navigation" size={20} color={colors.secondaryForeground} style={direction === 'rtl' ? { transform: [{ scaleX: -1 }] } : undefined} />
              <Text style={[styles.actionBtnText, { color: colors.secondaryForeground }]}>{t('delivery.navigate')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => openPhone(isPickedUp ? order.customerPhone : undefined)}
              disabled={!isPickedUp || !order.customerPhone}
              accessibilityRole="button"
              accessibilityLabel={t('delivery.call')}
            >
              <Feather name="phone" size={20} color={colors.foreground} />
              <Text style={[styles.actionBtnText, { color: colors.foreground }]}>{t('delivery.call')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="shopping-bag" size={20} color={colors.foreground} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('delivery.orderDetails')}</Text>
          </View>
          
          <View style={styles.itemsList}>
            {order.items?.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={[styles.itemQty, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.itemQtyText, { color: colors.foreground }]}>{item.quantity}x</Text>
                </View>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                  {item.name} {item.variantName ? `(${item.variantName})` : ''}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>{t('delivery.totalToCollect')}</Text>
            <Text style={[styles.totalValue, { color: order.paymentMethod === 'cash' ? colors.destructive : colors.success }]}>
              {order.paymentMethod === 'cash' ? formatCurrency(locale, order.total) : t('delivery.paidCard')}
            </Text>
          </View>
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 90, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {!isPickedUp ? (
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleUpdateStatus('picked_up' as any)}
            disabled={statusActionLocked || updateStatus.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('delivery.markPickedUp')}
            testID="pickup-button"
          >
            {updateStatus.isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.mainBtnText, { color: colors.primaryForeground }]}>{t('delivery.markPickedUp')}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: colors.success }]}
            onPress={() => handleUpdateStatus('delivered' as any)}
            disabled={statusActionLocked || updateStatus.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('delivery.complete')}
            testID="deliver-button"
          >
            {updateStatus.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.mainBtnText, { color: colors.primaryForeground }]}>{t('delivery.complete')}</Text>
            )}
          </TouchableOpacity>
        )}
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
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  locationName: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
    lineHeight: 24,
  },
  notesBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemQty: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemQtyText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  totalValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
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
  mainBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBtnText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
});
