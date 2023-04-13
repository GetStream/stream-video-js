import { Notification } from './Notification';
import { OwnCapability } from '@stream-io/video-client';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useHasPermissions } from '@stream-io/video-react-bindings';

export type PermissionGrantedNotificationProps = PropsWithChildren<{
  /**
   * The permission to check for.
   */
  permission: OwnCapability;

  /**
   * Set this to true if there is ongoing request for the permission.
   */
  isAwaitingApproval: boolean;

  /**
   * The message to display in the notification once
   * the requested permission is granted.
   */
  messageApproved: string;

  /**
   * The message to display in the notification while
   * the requested permission is awaiting approval.
   */
  messageAwaitingApproval: string;

  /**
   * The time in milliseconds to display the notification.
   * Defaults to 3500ms.
   */
  visibilityTimeout?: number;
}>;

export const PermissionGrantedNotification = (
  props: PermissionGrantedNotificationProps,
) => {
  const {
    permission,
    isAwaitingApproval,
    messageApproved,
    messageAwaitingApproval,
    visibilityTimeout = 3500,
    children,
  } = props;
  const hasPermission = useHasPermissions(permission);
  const prevHasPermission = useRef(hasPermission);
  const [showNotification, setShowNotification] = useState(false);
  useEffect(() => {
    if (hasPermission && !prevHasPermission.current) {
      setShowNotification(true);
      prevHasPermission.current = true;
    }
  }, [hasPermission]);

  const resetIsVisible = useCallback(() => setShowNotification(false), []);
  if (isAwaitingApproval) {
    return (
      <Notification
        isVisible={isAwaitingApproval && !hasPermission}
        message={messageAwaitingApproval}
      >
        {children}
      </Notification>
    );
  }

  return (
    <Notification
      isVisible={showNotification}
      visibilityTimeout={visibilityTimeout}
      resetIsVisible={resetIsVisible}
      message={messageApproved}
    >
      {children}
    </Notification>
  );
};
