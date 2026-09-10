import { revokeNotificationDevice } from '@workspace/api-client-react';
import { getPushDeviceId, removePushDeviceId } from '@/utils/storage';

export async function revokeCurrentPushDevice(): Promise<void> {
  const id = await getPushDeviceId();
  try {
    if (id) await revokeNotificationDevice(id);
  } catch {
    // Logout must continue when the device revoke request cannot reach the API.
  } finally {
    await removePushDeviceId();
  }
}