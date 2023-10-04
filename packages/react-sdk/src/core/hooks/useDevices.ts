import { ChangeEvent, useEffect, useState } from 'react';

export const useHasBrowserPermissions = (permissionName: PermissionName) => {
  const [canSubscribe, enableSubscription] = useState(false);

  useEffect(() => {
    let permissionState: PermissionStatus;
    const handlePermissionChange = (e: Event) => {
      const { state } = (e as unknown as ChangeEvent<PermissionStatus>).target;
      enableSubscription(state === 'granted');
    };
    const checkPermissions = async () => {
      try {
        permissionState = await navigator.permissions.query({
          name: permissionName,
        });
        permissionState.addEventListener('change', handlePermissionChange);
        enableSubscription(permissionState.state === 'granted');
      } catch (e) {
        // permission does not exist - cannot be queried
        // an example would be Firefox - camera, neither microphone perms can be queried
        enableSubscription(true);
      }
    };
    checkPermissions();

    return () => {
      permissionState?.removeEventListener('change', handlePermissionChange);
    };
  }, [permissionName]);

  return canSubscribe;
};
