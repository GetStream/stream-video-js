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
  icon?: ReactNode;
  clickToClose?: boolean;
  timer?: NodeJS.Timeout;
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

  const addNotification = useCallback((notification: Notification) => {
    const timer = setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);

    updateNotifications((_n) => [..._n, { ...notification, timer }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    updateNotifications((_n) => {
      const notification = _n.find((n) => n.id === id);

      if (notification?.timer) {
        clearTimeout(notification.timer);
      }

      return _n.filter((n) => n.id !== id);
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
