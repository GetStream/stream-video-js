import { Platform, PermissionsAndroid } from 'react-native';

export const verifyAndroidBluetoothPermissions = async () => {
  const shouldCheckForPermissions = Number(Platform.Version) >= 31;
  if (!shouldCheckForPermissions) {
    return true;
  }
  const getCheckPermissionPromise = () => {
    return PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    );
  };
  const hasPermission = await getCheckPermissionPromise();
  if (!hasPermission) {
    const getRequestPermissionPromise = async () => {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          buttonNegative: 'Deny',
          buttonNeutral: 'Ask Me Later',
          buttonPositive: 'Allow',
          message:
            'Permissions are required to route audio to bluetooth devices.',
          title: 'Bluetooth connect Access',
        },
      ).then((status) => status === PermissionsAndroid.RESULTS.GRANTED);
      return result;
    };
    const granted = await getRequestPermissionPromise();
    return granted;
  }
  return true;
};
