import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { registerNotificationDevice } from '@workspace/api-client-react';
import { useAuth } from '@/ctx/AuthContext';
import { setPushDeviceId } from '@/utils/storage';
import { useLocale } from '@/ctx/LocaleContext';

type PushStatus = 'idle' | 'registering' | 'registered' | 'permission-denied' | 'unavailable' | 'expo-go' | 'missing-project' | 'error';

type PushState = {
  status: PushStatus;
  message: string;
  retry: () => Promise<void>;
};

const PushNotificationsContext = createContext<PushState>({
  status: 'idle',
  message: '',
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
  const { t } = useLocale();
  const attemptRef = useRef(0);
  const [status, setStatus] = useState<PushStatus>('idle');

  const messageForStatus = (value: PushStatus): string => {
    switch (value) {
      case 'idle': return t('push.signIn');
      case 'registering': return t('push.enabling');
      case 'registered': return t('push.enabled');
      case 'permission-denied': return t('push.permissionOff');
      case 'unavailable': return t('push.nativeOnly');
      case 'expo-go': return t('push.expoGo');
      case 'missing-project': return t('push.missingProject');
      case 'error': return t('push.failed');
    }
  };

  const register = useCallback(async () => {
    const attempt = ++attemptRef.current;
    if (!token || isLoading) {
      setStatus('idle');
      return;
    }
    if (Platform.OS === 'web') {
      setStatus('unavailable');
      return;
    }
    if (Constants.appOwnership === 'expo') {
      setStatus('expo-go');
      return;
    }

    setStatus('registering');
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: t('push.channelName'),
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== 'granted') permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        if (attempt === attemptRef.current) {
          setStatus('permission-denied');
        }
        return;
      }
      const easProjectId = projectId();
      if (!easProjectId) {
        if (attempt === attemptRef.current) {
          setStatus('missing-project');
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
       setStatus('registered');
    } catch {
      if (attempt === attemptRef.current) {
        setStatus('error');
      }
    }
  }, [isLoading, t, token]);

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
    <PushNotificationsContext.Provider value={{ status, message: messageForStatus(status), retry: register }}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  return useContext(PushNotificationsContext);
}