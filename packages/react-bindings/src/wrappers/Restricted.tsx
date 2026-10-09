import { OwnCapability } from '@stream-io/video-client';

import { PropsWithChildren } from 'react';
import { useCall } from '../contexts';
import { useCallStateHooks } from '../hooks';

type RestrictedProps = PropsWithChildren<{
  /**
   * Required grants for the component to be able to render supplied children elements
   */
  requiredGrants: OwnCapability[];
  /**
   * Render children only if user can request capability, but does not have it
   */
  canRequestOnly?: boolean;
  /**
   * Render children only if user has capability
   */
  hasPermissionsOnly?: boolean;
  /**
   * Require all grants specified in `requiredGrants` to be available in the `availableGrants`,
   * component by default requires only one grant to appear in both arrays to render its children
   */
  requireAll?: boolean;
}>;

export const Restricted = ({
  canRequestOnly,
  hasPermissionsOnly,
  requiredGrants,
  requireAll = true,
  children,
}: RestrictedProps) => {
  const call = useCall();
  const { useCallSettings, useOwnCapabilities } = useCallStateHooks();
  const ownCapabilities = useOwnCapabilities();
  const settings = useCallSettings();
  const hasPermissions = requiredGrants[requireAll ? 'every' : 'some'](
    (capability) => ownCapabilities?.includes(capability),
  );

  if (hasPermissionsOnly) return hasPermissions ? <>{children}</> : null;

  const canRequest = requiredGrants.some((capability) =>
    call?.permissionsContext.canRequest(capability, settings),
  );

  if (canRequestOnly) return canRequest ? <>{children}</> : null;

  if (hasPermissions || canRequest) return <>{children}</>;

  return null;
};
