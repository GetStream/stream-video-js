import { Platform, PermissionsAndroid } from 'react-native';
import type { Permission } from 'react-native';

export interface PermissionsResult {
  recordAudio: boolean;
  postNotifications: boolean;
}

const allowedPostNotifications =
  Platform.OS === 'android' && Platform.Version < 33;

export const requestCallPermissions = async (): Promise<PermissionsResult> => {
  if (Platform.OS !== 'android') {
    return { recordAudio: true, postNotifications: true }; // iOS handles permissions differently
  }

  const permissions: string[] = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

  // Add POST_NOTIFICATIONS for Android 13+
  if (Platform.Version >= 33) {
    permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  // Add WRITE_CALL_LOG for call history (required for Android 6.0+)
  // Note: PermissionsAndroid doesn't have a constant for this, so we use the string directly
  // permissions.push('android.permission.WRITE_CALL_LOG');

  try {
    const results = await PermissionsAndroid.requestMultiple(
      permissions as Permission[]
    );

    // Check if all permissions are granted
    const allGranted = Object.values(results).every(
      (status) => status === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      const deniedPermissions = Object.entries(results)
        .filter(([, status]) => status !== PermissionsAndroid.RESULTS.GRANTED)
        .map(([permission]) => permission);

      console.warn('Denied permissions:', deniedPermissions);
    }

    return {
      recordAudio:
        results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
        PermissionsAndroid.RESULTS.GRANTED,
      postNotifications:
        results[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] ===
          PermissionsAndroid.RESULTS.GRANTED || allowedPostNotifications,
    };
  } catch (err) {
    console.warn('Error requesting permissions:', err);
    return { recordAudio: false, postNotifications: false };
  }
};

export const checkCallPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permissions: string[] = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

  // if (Platform.Version >= 26) {
  //   permissions.push(PermissionsAndroid.PERMISSIONS.MANAGE_OWN_CALLS);
  // }

  if (Platform.Version >= 33) {
    permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  // Add WRITE_CALL_LOG for call history (required for Android 6.0+)
  // Note: PermissionsAndroid doesn't have a constant for this, so we use the string directly
  // permissions.push('android.permission.WRITE_CALL_LOG');

  try {
    const results = await Promise.all(
      permissions.map((permission) =>
        PermissionsAndroid.check(permission as Permission)
      )
    );
    return Object.values(results).every((granted) => granted === true);
  } catch (err) {
    console.warn('Error checking permissions:', err);
    return false;
  }
};

export const requestPostNotificationPermissions =
  async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const results = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return (
      results === PermissionsAndroid.RESULTS.GRANTED || allowedPostNotifications
    );
  };

export const canPostNotifications = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  return PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
};
