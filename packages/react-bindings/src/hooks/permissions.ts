import { OwnCapability } from '@stream-io/video-client';
import { useCallMetadata } from './call';

/**
 * Hook that returns true if the current user has all the given permissions.
 *
 * @param permissions the permissions to check.
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
 */
export const useOwnCapabilities = () => {
  const metadata = useCallMetadata();
  return metadata?.own_capabilities || [];
};
