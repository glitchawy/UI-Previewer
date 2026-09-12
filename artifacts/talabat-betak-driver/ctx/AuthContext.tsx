import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getToken, setToken as setStorageToken, removeToken } from '@/utils/storage';
import { getDriverAccount, logout as apiLogout, type AuthSession } from '@workspace/api-client-react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { purgePreciseLocationQueue } from '@/utils/locationQueue';
import { revokeCurrentPushDevice } from '@/utils/pushRegistration';
import { requireDriverSession } from '@/lib/login-behavior';

const LOCATION_TASK_NAME = 'background-location-task';

async function stopAndPurgeTracking() {
  try {
    if (Platform.OS !== 'web' && await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME)) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (error) {
    console.warn('Failed to stop location task:', error);
  } finally {
    await purgePreciseLocationQueue();
  }
}

interface AuthState {
  token: string | null;
  isLoading: boolean;
  login: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedToken = await getToken();
      if (storedToken) {
        try {
          // Temporarily set token for api-client-react, assuming setAuthTokenGetter reads from storage
          // Actually, we can just call getDriverAccount, since setAuthTokenGetter in _layout reads from getToken()
          const account = await getDriverAccount();
          if (account) {
            setToken(storedToken);
          } else {
            await revokeCurrentPushDevice();
            await stopAndPurgeTracking();
            await removeToken();
          }
        } catch (err) {
          // Invalid, expired, non-driver, etc.
          await revokeCurrentPushDevice();
          await stopAndPurgeTracking();
          await removeToken();
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (session: AuthSession) => {
    try {
      await requireDriverSession(session, async (token) => {
        // The token has not been persisted yet, so provide it explicitly to
        // the generated logout request when revoking a wrong-role session.
        await apiLogout({
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      });
    } catch (error) {
      // Keep the same cleanup guarantees as logout. In particular, a stale
      // token must not survive a role-mismatch login attempt.
      await revokeCurrentPushDevice();
      await stopAndPurgeTracking();
      await removeToken();
      setToken(null);
      throw error;
    }

    await revokeCurrentPushDevice();
    await stopAndPurgeTracking();
    await setStorageToken(session.token);
    setToken(session.token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await revokeCurrentPushDevice();
      await apiLogout();
    } catch (e) {
      // ignore network error
    }
    await stopAndPurgeTracking();
    await removeToken();
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
