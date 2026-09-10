import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const WEB_STORAGE_KEY = 'talabat_betak_driver_session_token';
const PUSH_DEVICE_ID_KEY = 'driver_notification_device_id';

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(WEB_STORAGE_KEY, token);
    } catch (e) {
      console.warn('Failed to set token in localStorage', e);
    }
  } else {
    await SecureStore.setItemAsync('driver_token', token);
  }
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(WEB_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to get token from localStorage', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync('driver_token');
  }
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(WEB_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove token from localStorage', e);
    }
  } else {
    await SecureStore.deleteItemAsync('driver_token');
  }
}

export async function getPushDeviceId(): Promise<number | null> {
  const value = Platform.OS === 'web'
    ? localStorage.getItem(PUSH_DEVICE_ID_KEY)
    : await SecureStore.getItemAsync(PUSH_DEVICE_ID_KEY);
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function setPushDeviceId(id: number): Promise<void> {
  if (Platform.OS === 'web') localStorage.setItem(PUSH_DEVICE_ID_KEY, String(id));
  else await SecureStore.setItemAsync(PUSH_DEVICE_ID_KEY, String(id));
}

export async function removePushDeviceId(): Promise<void> {
  if (Platform.OS === 'web') localStorage.removeItem(PUSH_DEVICE_ID_KEY);
  else await SecureStore.deleteItemAsync(PUSH_DEVICE_ID_KEY);
}
