import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import { useAuth } from './AuthContext';
import { useGetDriverAccount, useUpdateDriverAvailability, getGetDriverAccountQueryKey, useGetActiveDriverOrder, getGetActiveDriverOrderQueryKey, updateDriverDispatchLocation, updateDriverLocation } from '@workspace/api-client-react';
import { purgePreciseLocationQueue } from '@/utils/locationQueue';

const LOCATION_TASK_NAME = 'background-location-task';

interface TrackingState {
  isOnline: boolean;
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  requestPermissions: () => Promise<void>;
  toggleOnline: (online: boolean) => Promise<void>;
}

const TrackingContext = createContext<TrackingState>({
  isOnline: false,
  foregroundGranted: false,
  backgroundGranted: false,
  requestPermissions: async () => {},
  toggleOnline: async () => {},
});

export function useTracking() {
  return useContext(TrackingContext);
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  
  const [isOnline, setIsOnline] = useState(false);
  const previousActiveOrderId = useRef<number | null>(null);
  const [foregroundStatus, requestForeground] = Location.useForegroundPermissions();
  const [backgroundStatus, requestBackground] = Location.useBackgroundPermissions();

  const updateAvailability = useUpdateDriverAvailability();

  // Read current account to sync online state initially
  const { data: account } = useGetDriverAccount({
    query: {
      enabled: !!token,
      queryKey: getGetDriverAccountQueryKey(),
    }
  });

  const { data: activeOrder } = useGetActiveDriverOrder({
    query: {
      enabled: isOnline,
      refetchInterval: 15000,
      queryKey: getGetActiveDriverOrderQueryKey(),
    }
  });

  const hasActiveOrder = activeOrder && activeOrder.status !== 'cancelled' && activeOrder.status !== 'delivered';

  useEffect(() => {
    if (account && 'isOnline' in account && typeof account.isOnline === 'boolean') {
      setIsOnline(account.isOnline);
    } else if (!token) {
      setIsOnline(false);
    }
  }, [account, token]);

  const requestPermissions = async () => {
    try {
      let fg = foregroundStatus;
      if (!fg?.granted) {
        fg = await requestForeground();
      }
      if (fg?.granted) {
        await requestBackground();
      }
    } catch (err) {
      console.warn('Failed to request permissions:', err);
    }
  };

  useEffect(() => {
    let webWatchId: number | null = null;
    let nativeWatchSubscription: Location.LocationSubscription | null = null;

    const manageLocation = async () => {
      let lastCoarseSentAt = 0;
      const sendCoarse = (lat: number, lng: number) => {
        const now = Date.now();
        if (now - lastCoarseSentAt < 30_000) return;
        lastCoarseSentAt = now;
        updateDriverDispatchLocation({
          lat: Math.round(lat * 100) / 100,
          lng: Math.round(lng * 100) / 100,
        }).catch(err => console.warn('Coarse dispatch location failed:', err));
      };
      if (Platform.OS === 'web') {
        if (!isOnline || !hasActiveOrder) await purgePreciseLocationQueue();
        if (isOnline) {
          if (navigator.geolocation && webWatchId === null) {
            webWatchId = navigator.geolocation.watchPosition(
              (position) => {
                if (hasActiveOrder) {
                  updateDriverLocation({
                    lat: position.coords.latitude, lng: position.coords.longitude,
                    ...(position.coords.accuracy ? { accuracy: position.coords.accuracy } : {}),
                  }).catch(err => console.warn(err));
                } else {
                  sendCoarse(position.coords.latitude, position.coords.longitude);
                }
              },
              (err) => console.warn('Web geolocation error:', err),
              { enableHighAccuracy: !!hasActiveOrder, maximumAge: 10000, timeout: 5000 }
            );
          }
        } else {
          if (webWatchId !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(webWatchId);
            webWatchId = null;
          }
        }
        return;
      }
      try {
        const hasBackgroundPermission = backgroundStatus?.granted;
        const hasForegroundPermission = foregroundStatus?.granted;
        let isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        const activeOrderId = hasActiveOrder ? activeOrder.id : null;
        if (previousActiveOrderId.current !== activeOrderId) {
          if (isRegistered) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            isRegistered = false;
          }
          if (nativeWatchSubscription) {
            nativeWatchSubscription.remove();
            nativeWatchSubscription = null;
          }
          await purgePreciseLocationQueue();
          previousActiveOrderId.current = activeOrderId;
        }

        const shouldTrack = isOnline && !!hasActiveOrder;

        if (shouldTrack) {
          if (hasBackgroundPermission) {
            if (!isRegistered) {
              await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Balanced,
                distanceInterval: 50,
                deferredUpdatesInterval: 10000,
                foregroundService: {
                  notificationTitle: 'Talabat Betak Driver',
                  notificationBody: 'Live location is on while you are working.',
                  notificationColor: '#705d00',
                },
              });
            }
            if (nativeWatchSubscription) {
              nativeWatchSubscription.remove();
              nativeWatchSubscription = null;
            }
          } else if (hasForegroundPermission) {
            if (isRegistered) {
              await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }
            if (!nativeWatchSubscription) {
              nativeWatchSubscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 },
                (location) => {
                  const point = { 
                    lat: location.coords.latitude, 
                    lng: location.coords.longitude,
                    ...(location.coords.accuracy ? { accuracy: location.coords.accuracy } : {})
                  };
                  updateDriverLocation(point).catch(err => console.warn(err));
                }
              );
            }
          } else {
            if (isRegistered) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            await purgePreciseLocationQueue();
          }
        } else {
          if (isRegistered) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          }
          if (nativeWatchSubscription) {
            nativeWatchSubscription.remove();
            nativeWatchSubscription = null;
          }
          await purgePreciseLocationQueue();
          if (isOnline && hasForegroundPermission) {
            nativeWatchSubscription = await Location.watchPositionAsync(
              { accuracy: Location.Accuracy.Balanced, distanceInterval: 250, timeInterval: 30_000 },
              (location) => sendCoarse(location.coords.latitude, location.coords.longitude),
            );
          }
        }
      } catch (err) {
        console.warn('Location update toggle failed:', err);
      }
    };
    
    manageLocation();

    return () => {
      if (Platform.OS === 'web' && webWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(webWatchId);
        webWatchId = null;
      }
      if (nativeWatchSubscription) {
        nativeWatchSubscription.remove();
        nativeWatchSubscription = null;
      }
    };
  }, [token, isOnline, hasActiveOrder, backgroundStatus?.granted, foregroundStatus?.granted]);

  const toggleOnline = async (online: boolean) => {
    if (online) {
      await requestPermissions();
    }
    
    await updateAvailability.mutateAsync({
      data: { available: online }
    });
    
    setIsOnline(online);
    const currentForeground = online ? await Location.getForegroundPermissionsAsync() : null;
    if (online && currentForeground?.granted) {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await updateDriverDispatchLocation({
        lat: Math.round(location.coords.latitude * 100) / 100,
        lng: Math.round(location.coords.longitude * 100) / 100,
      });
    } else if (!online) {
      await purgePreciseLocationQueue();
    }
  };

  return (
    <TrackingContext.Provider
      value={{
        isOnline,
        foregroundGranted: !!foregroundStatus?.granted,
        backgroundGranted: !!backgroundStatus?.granted,
        requestPermissions,
        toggleOnline,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
}
