import { FC } from 'react';
import classnames from 'classnames';

import { useScreenShareNotification } from '../../hooks/useScreenShareNotification';
import { useScreenRecordingNotification } from '../../hooks/useScreenRecordingNotification';
import { useSpeakingWhileMutedNotification } from '../../hooks/useSpeakingWhileMutedNotification';
import { useParticipantNotification } from '../../hooks/useParticipantNotification';
import { useConnectionNotification } from '../../hooks/useConnectionNotification';

import { useNotificationContext } from '../../contexts/NotificationsContext';

import styles from './Notifications.module.css';

export type Props = {
  className?: string;
};

export const Notifications: FC<Props> = ({ className }) => {
  const { notifications } = useNotificationContext();
  const rootClassNames = classnames(styles.root, className);

  useScreenShareNotification();
  useScreenRecordingNotification();
  useSpeakingWhileMutedNotification();
  useParticipantNotification();
  useConnectionNotification();

  return (
    <ul className={rootClassNames}>
      {notifications.map((notification) => (
        <li key={notification.id} className={styles.notification}>
          {notification?.icon && (
            <div className={styles.icon}>{notification?.icon}</div>
          )}
          <p>{notification.message}</p>
        </li>
      ))}
    </ul>
  );
};
