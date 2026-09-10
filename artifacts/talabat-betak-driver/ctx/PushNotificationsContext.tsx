import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { registerNotificationDevice } from '@workspace/api-client-react';
import { useAuth } from '@/ctx/AuthContext';
import { setPushDeviceId } from '@/utils/storage';

type PushStatus = 'idle' | 'registering' | 'registered' | 'permission-denied' | 'unavailable' | 'error';

type PushState = {
  status: PushStatus;
  message: string;
  retry: () => Promise<void>;
};

const PushNotificationsContext = createContext<PushState>({
  status: 'idle',
  message: 'Notifications are not configured.',
  retry: async () => {},
});

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string }; easProjectId?: string }
    | undefined;
  return Constants.easConfig?.projectId
    ?? extra?.eas?.projectId
    ?? extra?.easProjectId
    ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
}

export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const attemptRef = useRef(0);
  const [state, setState] = useState<Omit<PushState, 'retry'>>({
    status: 'idle',
    message: 'Sign in to enable order notifications.',
  });

  const register = useCallback(async () => {
    const attempt = ++attemptRef.current;
    if (!token || isLoading) {
      setState({ status: 'idle', message: 'Sign in to enable order notifications.' });
      return;
    }
    if (Platform.OS === 'web') {
      setState({ status: 'unavailable', message: 'Push notifications require the native driver app.' });
      return;
    }
    if (Constants.appOwnership === 'expo') {
      setState({ status: 'unavailable', message: 'Remote notifications are unavailable in Expo Go. Use a driver app build.' });
      return;
    }

    setState({ status: 'registering', message: 'Enabling order notifications…' });
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order updates',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== 'granted') permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        if (attempt === attemptRef.current) {
          setState({ status: 'permission-denied', message: 'Notification permission is off. Grant it and retry.' });
        }
        return;
      }
      const easProjectId = projectId();
      if (!easProjectId) {
        if (attempt === attemptRef.current) {
          setState({ status: 'unavailable', message: 'This build is missing its EAS project ID.' });
        }
        return;
      }
      const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId: easProjectId })).data;
      const record = await registerNotificationDevice({
        token: pushToken,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      const id = Number((record as { id?: unknown }).id);
      if (!Number.isInteger(id) || id < 1) throw new Error('Invalid notification device response');
      if (attempt !== attemptRef.current) return;
      await setPushDeviceId(id);
      setState({ status: 'registered', message: 'Order notifications are enabled.' });
    } catch {
      if (attempt === attemptRef.current) {
        setState({ status: 'error', message: 'Could not enable order notifications. Check your connection and retry.' });
      }
    }
  }, [isLoading, token]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
  }, []);

  useEffect(() => {
    void register();
    return () => { attemptRef.current += 1; };
  }, [register]);

  return (
    <PushNotificationsContext.Provider value={{ ...state, retry: register }}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  return useContext(PushNotificationsContext);
}