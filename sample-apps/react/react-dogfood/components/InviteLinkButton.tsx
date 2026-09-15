import { ComponentProps, ForwardedRef, forwardRef } from 'react';
import { IconButton } from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { useAppI18n } from '../hooks/useAppI18n';

export const InviteLinkButton = forwardRef(function InviteLinkButtonRender(
  { className, ...props }: ComponentProps<'button'>,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const { t } = useAppI18n();
  return (
    <button
      {...props}
      className={clsx('str-video__invite-link-button', className)}
      ref={ref}
    >
      <div className="str-video__invite-participant-icon" />
      <div className="str-video__invite-link-button__text">
        {t('invite.inviteLink.label', 'Invite Link')}
      </div>
    </button>
  );
});

export const IconInviteLinkButton = forwardRef(
  function IconInviteLinkButtonRender(
    { className, ...props }: ComponentProps<'button'>,
    ref: ForwardedRef<HTMLButtonElement>,
  ) {
    return (
      <IconButton
        {...props}
        size="sm"
        variant="secondary"
        className={clsx('str-video__invite-link-button', className)}
        ref={ref}
        icon="user-plus"
      />
    );
  },
);
