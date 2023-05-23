import { OwnCapability, PermissionRequestEvent } from '@stream-io/video-client';
import { useCallMetadata } from './call';
import { useCallState } from './store';
import { useObservableValue } from './helpers/useObservableValue';

/**
 * Hook that returns true if the current user has all the given permissions.
 *
 * @param permissions the permissions to check.
 *
 * @category Call State
 */
export const useHasPermissions = (...permissions: OwnCapability[]) => {
  const metadata = useCallMetadata();
  if (!metadata) return false;
  return permissions.every((permission) =>
    metadata.own_capabilities.includes(permission),
  );
};

/**
 * A hook which returns the current user's own capabilities.
 *
 * @category Call State
 */
export const useOwnCapabilities = (): OwnCapability[] => {
  const metadata = useCallMetadata();
  return metadata?.own_capabilities || [];
};

/**
 * A hook which returns the latest call permission request.
 *
 * @category Call State
 */
export const useCallPermissionRequest = ():
  | PermissionRequestEvent
  | undefined => {
  const { callPermissionRequest$ } = useCallState();
  return useObservableValue(callPermissionRequest$);
};
