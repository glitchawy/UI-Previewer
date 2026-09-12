import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGetDriverEarnings, useListDriverDeliveries, getListDriverDeliveriesQueryKey } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { useLocale } from '@/ctx/LocaleContext';
import { formatCurrency, formatDate } from '@/lib/i18n';

export default function EarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, locale, direction } = useLocale();
  
  const { data: earnings, isLoading: earningsLoading, isError: earningsError, refetch: refetchEarnings } = useGetDriverEarnings();
  const { data: deliveries, isLoading: deliveriesLoading, isError: deliveriesError, refetch: refetchDeliveries } = useListDriverDeliveries(
    { page: 1, pageSize: 50 },
    {
      query: {
        queryKey: getListDriverDeliveriesQueryKey({ page: 1, pageSize: 50 })
      }
    }
  );

  const isRefreshing = earningsLoading || deliveriesLoading;
  const onRefresh = async () => {
    await Promise.all([refetchEarnings(), refetchDeliveries()]);
  };

  const earningsData = earnings as any;
  const deliveryList = (deliveries as any)?.items || [];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.summaryLabel, { color: colors.primaryForeground }]}>{t('earnings.thisWeek')}</Text>
        <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>
          {formatCurrency(locale, earningsData?.weeklyTotal)}
        </Text>
        
        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('earnings.deliveries')}</Text>
            <Text style={[styles.summaryStatValue, { color: colors.primaryForeground }]}>{earningsData?.weeklyCount || 0}</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('earnings.onlineHours')}</Text>
            <Text style={[styles.summaryStatValue, { color: colors.primaryForeground }]}>{t('earnings.hours', { hours: (earningsData?.weeklyHours || 0).toFixed(1) })}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('earnings.recent')}</Text>
    </View>
  );

  const renderEmpty = () => {
    if (deliveriesLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (earningsError || deliveriesError) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]} accessibilityRole="alert">{t('common.loadError')}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Feather name="file-text" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('earnings.noRecent')}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.deliveryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.deliveryHeader}>
        <View>
          <Text style={[styles.deliveryCode, { color: colors.foreground }]}>#{item.code}</Text>
          <Text style={[styles.deliveryDate, { color: colors.mutedForeground }]}>{formatDate(locale, item.createdAt)}</Text>
        </View>
        <Text style={[styles.deliveryAmount, { color: colors.foreground }]}>{formatCurrency(locale, item.deliveryFee)}</Text>
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      
      <View style={styles.deliveryLocations}>
        <View style={styles.locationItem}>
          <Feather name="circle" size={12} color={colors.mutedForeground} />
          <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.restaurantName}
          </Text>
        </View>
        <View style={styles.locationItem}>
          <Feather name="map-pin" size={12} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.foreground }]} numberOfLines={1}>
            {item.deliveryAddressText || t('earnings.customer')}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, direction }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('tabs.earnings')}</Text>
      </View>

      <FlatList
        data={deliveryList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100, direction }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
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
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 16,
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
  summaryStat: {
    flex: 1,
  },
  summaryStatLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
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
  deliveryLocations: {
    gap: 8,
  },
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
});
