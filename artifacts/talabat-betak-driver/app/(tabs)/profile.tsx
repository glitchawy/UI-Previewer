import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/ctx/AuthContext';
import { useTracking } from '@/ctx/TrackingContext';
import { useGetDriverAccount, useListDriverDocuments } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { usePushNotifications } from '@/ctx/PushNotificationsContext';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { foregroundGranted, backgroundGranted, requestPermissions } = useTracking();
  const { status: pushStatus, message: pushMessage, retry: retryPush } = usePushNotifications();
  
  const { data: account, isLoading: accountLoading, refetch: refetchAccount } = useGetDriverAccount();
  const { data: documents, isLoading: docsLoading, refetch: refetchDocs } = useListDriverDocuments();

  const isRefreshing = accountLoading || docsLoading;
  const onRefresh = async () => {
    await Promise.all([refetchAccount(), refetchDocs()]);
  };

  const driverAccount = account as any;
  const docsList = (documents as any)?.items || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'rejected': return colors.destructive;
      default: return colors.accentForeground;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
            <Feather name="user" size={32} color={colors.mutedForeground} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.foreground }]}>{driverAccount?.fullName || 'Driver'}</Text>
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>{driverAccount?.phone || 'Loading...'}</Text>
            
            <View style={[styles.approvalBadge, { backgroundColor: getStatusColor(driverAccount?.status) + '20' }]}>
              <Text style={[styles.approvalText, { color: getStatusColor(driverAccount?.status) }]}>
                {driverAccount?.status ? driverAccount.status.toUpperCase() : 'PENDING'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Permissions</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            <View style={styles.permRow}>
              <View style={styles.permIcon}>
                <Feather name="map-pin" size={20} color={colors.foreground} />
              </View>
              <View style={styles.permInfo}>
                <Text style={[styles.permTitle, { color: colors.foreground }]}>Location (While using app)</Text>
                <Text style={[styles.permSub, { color: colors.mutedForeground }]}>Required to receive orders</Text>
              </View>
              {foregroundGranted ? (
                <Feather name="check" size={20} color={colors.success} />
              ) : (
                <TouchableOpacity onPress={requestPermissions} style={[styles.permBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.permBtnText, { color: colors.primaryForeground }]}>Grant</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.permRow}>
              <View style={styles.permIcon}>
                <Feather name="bell" size={20} color={colors.foreground} />
              </View>
              <View style={styles.permInfo}>
                <Text style={[styles.permTitle, { color: colors.foreground }]}>Order Notifications</Text>
                <Text style={[styles.permSub, { color: colors.mutedForeground }]}>{pushMessage}</Text>
              </View>
              {pushStatus === 'registered' ? (
                <Feather name="check" size={20} color={colors.success} />
              ) : (
                <TouchableOpacity
                  onPress={() => { void retryPush(); }}
                  disabled={pushStatus === 'registering'}
                  style={[styles.permBtn, { backgroundColor: colors.primary, opacity: pushStatus === 'registering' ? 0.6 : 1 }]}
                >
                  <Text style={[styles.permBtnText, { color: colors.primaryForeground }]}>
                    {pushStatus === 'registering' ? 'Enabling…' : 'Retry'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.permRow}>
              <View style={styles.permIcon}>
                <Feather name="navigation" size={20} color={colors.foreground} />
              </View>
              <View style={styles.permInfo}>
                <Text style={[styles.permTitle, { color: colors.foreground }]}>Background Location</Text>
                <Text style={[styles.permSub, { color: colors.mutedForeground }]}>Required for active tracking</Text>
                {Platform.OS === 'web' && (
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}>
                    Note: Native app required for background tracking.
                  </Text>
                )}
              </View>
              {backgroundGranted ? (
                <Feather name="check" size={20} color={colors.success} />
              ) : (
                <TouchableOpacity onPress={requestPermissions} style={[styles.permBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.permBtnText, { color: colors.primaryForeground }]}>Grant</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documents</Text>
          
          {docsList.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {docsList.map((doc: any, index: number) => (
                <View key={doc.id || index}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.docRow}>
                    <View style={styles.permInfo}>
                      <Text style={[styles.permTitle, { color: colors.foreground }]}>
                        {doc.documentType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Text>
                      <Text style={[styles.permSub, { color: colors.mutedForeground }]}>
                        Status: {doc.reviewStatus}
                      </Text>
                    </View>
                    <View style={[styles.docStatusBadge, { backgroundColor: getStatusColor(doc.reviewStatus) + '20' }]}>
                      <Feather 
                        name={doc.reviewStatus === 'approved' ? 'check' : doc.reviewStatus === 'rejected' ? 'x' : 'clock'} 
                        size={16} 
                        color={getStatusColor(doc.reviewStatus)} 
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyDocs, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyDocsText, { color: colors.mutedForeground }]}>No documents found</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.logoutBtn, { borderColor: colors.destructive }]}
          onPress={logout}
          testID="logout-button"
        >
          <Feather name="log-out" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>

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
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  content: {
    padding: 16,
    gap: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  phone: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  approvalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvalText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  permIcon: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permInfo: {
    flex: 1,
  },
  permTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  permSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  permBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  docStatusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDocs: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyDocsText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
