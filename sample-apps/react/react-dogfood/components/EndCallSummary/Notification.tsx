import clsx from 'clsx';
import { Icon } from '@stream-io/video-react-sdk';

type NotificationProps = {
  message: string;
  variant: 'success' | 'error' | 'info' | 'caution';
};

export const Notification = ({ message, variant }: NotificationProps) => {
  const icon = {
    success: 'success',
    error: 'error',
    info: 'info',
    caution: 'caution',
  };

  return (
    <div
      className={clsx('rd__notification', {
        'rd__notification--success': variant === 'success',
        'rd__notification--error': variant === 'error',
        'rd__notification--info': variant === 'info',
        'rd__notification--caution': variant === 'caution',
      })}
    >
      <Icon icon={icon[variant]} />
      {message}
    </div>
  );
};
