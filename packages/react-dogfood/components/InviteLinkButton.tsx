import { ComponentProps, ForwardedRef, forwardRef } from 'react';
import { IconButton } from '@stream-io/video-react-sdk';

export const InviteLinkButton = forwardRef(
  (props: ComponentProps<'button'>, ref: ForwardedRef<HTMLButtonElement>) => (
    <button {...props} ref={ref}>
      <div className="str-video__invite-participant-icon" />
      <div className="str-video__invite-link-button__text">Invite Link</div>
    </button>
  ),
);

export const IconInviteLinkButton = forwardRef(
  (props: ComponentProps<'button'>, ref: ForwardedRef<HTMLButtonElement>) => (
    <IconButton {...props} icon={'user-plus'} ref={ref} />
  ),
);
