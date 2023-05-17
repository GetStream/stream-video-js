import { OwnCapability } from '@stream-io/video-client';

import { PropsWithChildren } from 'react';
import { useCall } from '../contexts';
import { useOwnCapabilities } from '../hooks';

type RestrictedProps = PropsWithChildren<{
  /**
   * OwnCapabilities of the participant - grants they have available
   */
  availableGrants?: OwnCapability[];
  /**
   * Required grants for the component to be able to render supplied children elements
   */
  requiredGrants: OwnCapability[];
  /**
   * Require all grants specified in `requiredGrants` to be available in the `availableGrants`,
   * component by default requires only one grant to appear in both arrays to render its children
   */
  requireAll?: boolean;
}>;

export const Restricted = ({
  availableGrants: availableGrantsFromProps,
  requiredGrants,
  requireAll = true,
  children,
}: RestrictedProps) => {
  const call = useCall();
  const ownCapabilities = useOwnCapabilities();
  const availableGrants = availableGrantsFromProps ?? ownCapabilities;
  const hasPermissions = requiredGrants[requireAll ? 'every' : 'some'](
    (capability) => availableGrants.includes(capability),
  );
  const canRequest = requiredGrants.some(
    (capability) => !!call && call.permissionsContext.canRequest(capability),
  );
  if (hasPermissions || canRequest) return <>{children}</>;
  return null;
};
