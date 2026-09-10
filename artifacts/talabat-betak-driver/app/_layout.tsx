import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBaseUrl, setAuthTokenGetter, updateDriverLocation, getDriverAccount, getActiveDriverOrder } from '@workspace/api-client-react';
import { getToken } from '@/utils/storage';
import { AuthProvider, useAuth } from '@/ctx/AuthContext';
import { TrackingProvider } from '@/ctx/TrackingContext';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { filterPreciseLocationQueue, LOCATION_QUEUE_KEY, type PreciseLocationQueueEntry, purgePreciseLocationQueue } from '@/utils/locationQueue';

const LOCATION_TASK_NAME = 'background-location-task';

// Configure api-client-react
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
setAuthTokenGetter(async () => {
  return await getToken();
});

// Register background task
if (Platform.OS !== 'web') {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('Background location task error:', error);
      return;
    }
    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      if (locations && locations.length > 0) {
        const latest = locations[locations.length - 1];
        try {
          // Check privacy invariants before queuing/sending
          let account;
          let activeOrder;
          try {
            account = await getDriverAccount();
            activeOrder = await getActiveDriverOrder();
          } catch (e) {
            // If auth fails or endpoint errors, stop tracking and discard
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            await purgePreciseLocationQueue();
            return;
          }

          const hasActiveOrder = activeOrder && (activeOrder as any).status !== 'cancelled' && (activeOrder as any).status !== 'delivered';
          if (!account || (account as any).status !== 'APPROVED' || !(account as any).isOnline || !hasActiveOrder) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            await purgePreciseLocationQueue();
            return;
          }

          const queueStr = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
          const driverId = Number((account as any).id);
          const orderId = Number((activeOrder as any).id);
          const queuedPoint: PreciseLocationQueueEntry = {
            driverId,
            orderId,
            capturedAt: latest.timestamp || Date.now(),
            lat: latest.coords.latitude,
            lng: latest.coords.longitude,
            ...(latest.coords.accuracy != null ? { accuracy: latest.coords.accuracy } : {}),
          };
          const queue = filterPreciseLocationQueue(
            [...(queueStr ? JSON.parse(queueStr) : []), queuedPoint],
            driverId,
            orderId,
            Date.now(),
          );
          let remainingQueue = [...queue];
          
          try {
            // Attempt queued points in order
            while (remainingQueue.length > 0) {
              const { driverId: _driverId, orderId: _orderId, capturedAt: _capturedAt, ...point } = remainingQueue[0] as PreciseLocationQueueEntry;
              await updateDriverLocation(point);
              remainingQueue.shift(); // Remove successful point
            }
            await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
          } catch (err) {
            console.error('Failed to update background location', err);
            if (remainingQueue.length > 50) remainingQueue = remainingQueue.slice(remainingQueue.length - 50);
            await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(remainingQueue));
          }
        } catch (e) {
          // Ignore storage errors for reading the queue
        }
      }
    }
  });
}

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    
    if (!token && inAuthGroup) {
      // Redirect to login
      router.replace('/');
    } else if (token && !inAuthGroup) {
      // Redirect to app
      router.replace('/(tabs)');
    }
  }, [token, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TrackingProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </TrackingProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
