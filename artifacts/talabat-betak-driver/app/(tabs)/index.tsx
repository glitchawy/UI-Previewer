import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTracking } from '@/ctx/TrackingContext';
import { useGetDriverAccount, useGetAvailableDriverOrder, useGetActiveDriverOrder, getGetAvailableDriverOrderQueryKey, getGetActiveDriverOrderQueryKey } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function StatusScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isOnline, toggleOnline, locationError, dispatchUpdatedAt, refreshDispatchLocation } = useTracking();
  
  const { data: account, refetch: refetchAccount, isLoading: accountLoading } = useGetDriverAccount();
  const { data: offer, refetch: refetchOffer } = useGetAvailableDriverOrder({
    query: {
      enabled: isOnline,
      refetchInterval: 10000,
      queryKey: getGetAvailableDriverOrderQueryKey(),
    }
  });
  const { data: activeOrder, refetch: refetchActive } = useGetActiveDriverOrder({
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

  // Check if we have an offer or active order and provide quick jump
  const driverState = account as any;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Shift Status</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Availability</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.success : colors.mutedForeground }]} />
              <Text style={[styles.statusText, { color: isOnline ? colors.success : colors.mutedForeground }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
              {isOnline ? 'You are receiving orders' : 'Go online to receive orders'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
              testID="online-toggle"
            />
          </View>
        </View>
        {locationError ? (
          <Text style={{ color: colors.destructive }}>{locationError}</Text>
        ) : null}
        {isOnline && !activeOrder ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>موقع الإسناد</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {locationError ? 'تعذر التحديث' : dispatchUpdatedAt &&
                Date.now() - dispatchUpdatedAt < 120_000 ? 'الموقع حديث' : 'الموقع يحتاج تحديث'}
            </Text>
            <TouchableOpacity
              onPress={() => void refreshDispatchLocation()}
              style={{ marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: colors.primary }}
            >
              <Text style={{ color: colors.primaryForeground, textAlign: 'center' }}>تحديث موقع الإسناد</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{driverState?.completedToday || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completed Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="star" size={24} color={colors.accentForeground} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{driverState?.rating?.toFixed(1) || 'N/A'}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Rating</Text>
          </View>
        </View>

        {isOnline && (offer || activeOrder) ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Current Workload</Text>
            
            {offer && (
              <View style={[styles.workloadItem, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                <View style={styles.workloadIcon}>
                  <Feather name="bell" size={24} color={colors.accentForeground} />
                </View>
                <View style={styles.workloadInfo}>
                  <Text style={[styles.workloadTitle, { color: colors.accentForeground }]}>New Offer Available</Text>
                  <Text style={[styles.workloadSub, { color: colors.accentForeground }]}>Expiring soon</Text>
                </View>
                <Text 
                  style={[styles.actionLink, { color: colors.accentForeground }]} 
                  onPress={() => router.push('/(tabs)/offers')}
                >
                  View
                </Text>
              </View>
            )}

            {activeOrder && (
              <View style={[styles.workloadItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.workloadIcon}>
                  <Feather name="map-pin" size={24} color={colors.primary} />
                </View>
                <View style={styles.workloadInfo}>
                  <Text style={[styles.workloadTitle, { color: colors.foreground }]}>Active Delivery</Text>
                  <Text style={[styles.workloadSub, { color: colors.mutedForeground }]}>
                    {((activeOrder as any)?.status || 'In progress').replace('_', ' ')}
                  </Text>
                </View>
                <Text 
                  style={[styles.actionLink, { color: colors.primary }]} 
                  onPress={() => router.push('/(tabs)/delivery')}
                >
                  View
                </Text>
              </View>
            )}
          </View>
        ) : isOnline ? (
          <View style={styles.emptyState}>
            <Feather name="coffee" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>Waiting for new orders...</Text>
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
    marginRight: 6,
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
    marginRight: 16,
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
