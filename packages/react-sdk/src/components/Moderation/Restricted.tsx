import { PropsWithChildren } from 'react';
import { OwnCapabilities } from '@stream-io/video-client';

type RestrictedProps = PropsWithChildren<{
  /**
   * OwnCapabilities of the participant - grants they have available
   */
  availableGrants: OwnCapabilities | string[]; // FIXME: replace type once properly typed in StreamVideoParticipant
  /**
   * Required grants for the component to be able to render supplied children elements
   */
  requiredGrants: OwnCapabilities;
  /**
   * Require all grants specified in `requiredGrants` to be available in the `availableGrants`,
   * component by default requires only one grant to appear in both arrays to render its children
   */
  requireAll?: boolean;
}>;

export const Restricted = ({
  availableGrants,
  requiredGrants,
  requireAll,
  children,
}: RestrictedProps) => {
  if (
    requiredGrants[requireAll ? 'every' : 'some']((capability) =>
      availableGrants.includes(capability),
    )
  )
    return <>{children}</>;
  return null;
};
