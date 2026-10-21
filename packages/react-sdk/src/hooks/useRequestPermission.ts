import { useCallback, useEffect, useState } from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

export const useRequestPermission = (permission: OwnCapability) => {
  const call = useCall();
  const { useHasPermissions } = useCallStateHooks();
  const hasPermission = useHasPermissions(permission);
  const [isAwaitingPermission, setIsAwaitingPermission] = useState(false); // TODO: load with possibly pending state

  useEffect(() => {
    const reset = () => setIsAwaitingPermission(false);

    if (hasPermission) reset();
  }, [hasPermission]);

  const requestPermission = useCallback(async () => {
    if (hasPermission) return true;

    const canRequestPermission =
      !!call?.permissionsContext.canRequest(permission);
    if (isAwaitingPermission || !canRequestPermission) return false;

    setIsAwaitingPermission(true);

    try {
      await call?.requestPermissions({
        permissions: [permission],
      });
    } catch (error) {
      setIsAwaitingPermission(false);
      throw new Error(`requestPermission failed: ${error}`);
    }

    return false;
  }, [call, hasPermission, isAwaitingPermission, permission]);

  return {
    requestPermission,
    hasPermission,
    canRequestPermission: !!call?.permissionsContext.canRequest(permission),
    isAwaitingPermission,
  };
};
