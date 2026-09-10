import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const WEB_STORAGE_KEY = 'talabat_betak_driver_session_token';

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
