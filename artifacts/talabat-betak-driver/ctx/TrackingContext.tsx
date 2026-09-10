import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { AppState, Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useGetDriverAccount, useUpdateDriverAvailability, getGetDriverAccountQueryKey, useGetActiveDriverOrder, getGetActiveDriverOrderQueryKey, getGetAvailableDriverOrderQueryKey, updateDriverDispatchLocation, updateDriverLocation } from '@workspace/api-client-react';
import { purgePreciseLocationQueue } from '@/utils/locationQueue';

const LOCATION_TASK_NAME = 'background-location-task';

interface TrackingState {
  isOnline: boolean;
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  locationError: string | null;
  dispatchUpdatedAt: number | null;
  refreshDispatchLocation: () => Promise<boolean>;
  requestPermissions: () => Promise<void>;
  toggleOnline: (online: boolean) => Promise<void>;
}

const TrackingContext = createContext<TrackingState>({
  isOnline: false,
  foregroundGranted: false,
  backgroundGranted: false,
  locationError: null,
  dispatchUpdatedAt: null,
  refreshDispatchLocation: async () => false,
  requestPermissions: async () => {},
  toggleOnline: async () => {},
});

export function useTracking() {
  return useContext(TrackingContext);
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  
  const [isOnline, setIsOnline] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const dispatchFlightRef = useRef<Promise<boolean> | null>(null);
  const queryClient = useQueryClient();
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
  const accountDispatchUpdatedAt = account && 'dispatchLocationUpdatedAt' in account &&
    typeof account.dispatchLocationUpdatedAt === 'string'
    ? account.dispatchLocationUpdatedAt
    : null;
  const dispatchUpdatedAt = accountDispatchUpdatedAt
    ? Date.parse(accountDispatchUpdatedAt)
    : null;

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
      if (Platform.OS === 'web') {
        if (!isOnline || !hasActiveOrder) await purgePreciseLocationQueue();
        if (isOnline && hasActiveOrder) {
          if (navigator.geolocation && webWatchId === null) {
            webWatchId = navigator.geolocation.watchPosition(
              (position) => {
                if (hasActiveOrder) {
                  updateDriverLocation({
                    lat: position.coords.latitude, lng: position.coords.longitude,
                    ...(position.coords.accuracy ? { accuracy: position.coords.accuracy } : {}),
                  }).catch(err => console.warn(err));
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

  const refreshDispatchLocation = useCallback(() => {
    if (dispatchFlightRef.current) return dispatchFlightRef.current;
    const flight = (async () => {
      setLocationError(null);
      try {
        const currentForeground = await Location.getForegroundPermissionsAsync();
        if (!currentForeground.granted) {
          setLocationPermissionDenied(true);
          setLocationError('Location permission is required to receive delivery offers.');
          return false;
        }
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        let capturedAt = Date.now();
        if (Date.now() - capturedAt > 30_000) {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          capturedAt = Date.now();
        }
        await updateDriverDispatchLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          capturedAt: new Date(capturedAt).toISOString(),
        });
        await queryClient.invalidateQueries({ queryKey: getGetDriverAccountQueryKey() });
        await queryClient.invalidateQueries({ queryKey: getGetAvailableDriverOrderQueryKey() });
        return true;
      } catch (error) {
        console.warn('Foreground dispatch location failed:', error);
        const status = typeof error === 'object' && error && 'status' in error
          ? Number((error as { status: unknown }).status)
          : null;
        setLocationError(status === 400
          ? 'You are online, but the location was stale, invalid, or outside Egypt.'
          : 'You are online, but location permission or positioning failed.');
        return false;
      } finally {
        dispatchFlightRef.current = null;
      }
    })();
    dispatchFlightRef.current = flight;
    return flight;
  }, [queryClient]);

  useEffect(() => {
    if (!isOnline || hasActiveOrder || locationPermissionDenied) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const syncLoop = (state = AppState.currentState) => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (state === 'active') {
        timer = setInterval(() => void refreshDispatchLocation(), 60_000);
      }
    };
    syncLoop();
    const subscription = AppState.addEventListener('change', syncLoop);
    return () => {
      if (timer) clearInterval(timer);
      subscription.remove();
    };
  }, [isOnline, hasActiveOrder, locationPermissionDenied, refreshDispatchLocation]);

  const toggleOnline = async (online: boolean) => {
    setLocationError(null);
    setLocationPermissionDenied(false);
    if (online) {
      const foreground = await Location.getForegroundPermissionsAsync();
      if (!foreground.granted) await requestForeground();
    }
    
    await updateAvailability.mutateAsync({
      data: { available: online }
    });
    
    setIsOnline(online);
    if (online) {
      await refreshDispatchLocation();
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
        locationError,
        dispatchUpdatedAt,
        refreshDispatchLocation,
        requestPermissions,
        toggleOnline,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
}
