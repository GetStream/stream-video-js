import { ComponentProps, ForwardedRef, forwardRef } from 'react';
import { IconButton } from '@stream-io/video-react-sdk';
import clsx from 'clsx';

export const InviteLinkButton = forwardRef(
  (
    { className, ...props }: ComponentProps<'button'>,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => (
    <button
      {...props}
      className={clsx('str-video__invite-link-button', className)}
      ref={ref}
    >
      <div className="str-video__invite-participant-icon" />
      <div className="str-video__invite-link-button__text">Invite Link</div>
    </button>
  ),
);

export const IconInviteLinkButton = forwardRef(
  (
    { className, ...props }: ComponentProps<'button'>,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => (
    <IconButton
      {...props}
      icon={'user-plus'}
      className={clsx('str-video__invite-link-button', className)}
      ref={ref}
    />
  ),
);
