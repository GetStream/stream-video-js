import { OwnCapability } from '@stream-io/video-client';
import { useCallState } from './callStateHooks';
import { useObservableValue } from './useObservableValue';

/**
 * Hook that returns true if the local participant has all the given permissions.
 *
 * @param permissions the permissions to check.
 *
 * @category Call State
 */
export const useHasPermissions = (...permissions: OwnCapability[]): boolean => {
  const capabilities = useOwnCapabilities();
  return permissions.every((permission) => capabilities.includes(permission));
};

/**
 * A hook which returns the local participant's own capabilities.
 *
 * @category Call State
 */
export const useOwnCapabilities = (): OwnCapability[] => {
  const { ownCapabilities$ } = useCallState();
  return useObservableValue(ownCapabilities$);
};
