import { ComponentProps, ForwardedRef, forwardRef } from 'react';
import { IconButton } from '@stream-io/video-react-sdk';
import clsx from 'clsx';

export const InviteLinkButton = forwardRef(function InviteLinkButton(
  { className, ...props }: ComponentProps<'button'>,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      className={clsx('str-video__invite-link-button', className)}
      ref={ref}
    >
      <div className="str-video__invite-participant-icon" />
      <div className="str-video__invite-link-button__text">Invite Link</div>
    </button>
  );
});

export const IconInviteLinkButton = forwardRef(function IconInviteLinkButton(
  { className, ...props }: ComponentProps<'button'>,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <IconButton
      {...props}
      icon={'user-plus'}
      className={clsx('str-video__invite-link-button', className)}
      ref={ref}
    />
  );
});
