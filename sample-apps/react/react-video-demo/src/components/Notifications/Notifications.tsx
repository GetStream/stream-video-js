import { FC } from 'react';
import classnames from 'classnames';

import { useScreenShareNotification } from '../../hooks/useScreenShareNotification';
import { useScreenRecordingNotification } from '../../hooks/useScreenRecordingNotification';

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
