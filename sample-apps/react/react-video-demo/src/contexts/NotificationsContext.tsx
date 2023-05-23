import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
} from 'react';

type Notification = {
  id: string;
  message: string;
  icon?: ReactNode | undefined;
  timer?: number;
  clickToClose?: boolean;
};
type Props = {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
};

const NotificationContext = createContext<Props>({
  notifications: [],
  addNotification: () => null,
  removeNotification: () => null,
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, updateNotifications] = useState<Notification[]>([]);
  const [notificationTimers, updateNotificationTimers] = useState<any>([]);

  const handleAddNotification = useCallback(
    (notification: Notification) => {
      const notificationTimer = setTimeout(() => {
        handleRemoveNotification(notification.id);
      }, 5000);

      const timers = (notificationTimers[notification.id] = notificationTimer);

      updateNotificationTimers(timers);

      updateNotifications([...notifications, notification]);
    },
    [notifications, notificationTimers],
  );

  const handleRemoveNotification = useCallback(
    (id: string) => {
      updateNotifications(notifications.filter((n) => n.id !== id));

      updateNotificationTimers(
        notificationTimers.filter((_: any, index: string) => index !== id),
      );

      clearTimeout(notificationTimers[id]);

      updateNotifications(
        notificationTimers.filter((_: any, index: string) => index !== id),
      );
    },
    [notifications, notificationTimers],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification: handleAddNotification,
        removeNotification: handleRemoveNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
