import { Notification } from './Notification';
import { OwnCapability } from '@stream-io/video-client';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

export type PermissionNotificationProps = PropsWithChildren<{
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
   * The message to display in the notification once a permission
   * is revoked.
   */
  messageRevoked: string;

  /**
   * The message to display in the notification while
   * the requested permission is awaiting approval.
   */
  messageAwaitingApproval: string;

  /**
   * The permission to check for.
   */
  permission: OwnCapability;

  /**
   * The time in milliseconds to display the notification.
   * Defaults to 3500ms.
   */
  visibilityTimeout?: number;
}>;

export const PermissionNotification = (props: PermissionNotificationProps) => {
  const {
    permission,
    isAwaitingApproval,
    messageApproved,
    messageAwaitingApproval,
    messageRevoked,
    visibilityTimeout = 3500,
    children,
  } = props;
  const { useHasPermissions } = useCallStateHooks();
  const hasPermission = useHasPermissions(permission);
  const prevHasPermission = useRef(hasPermission);
  const [showNotification, setShowNotification] = useState<
    'granted' | 'revoked'
  >();
  useEffect(() => {
    if (hasPermission && !prevHasPermission.current) {
      setShowNotification('granted');
      prevHasPermission.current = true;
    } else if (!hasPermission && prevHasPermission.current) {
      setShowNotification('revoked');
      prevHasPermission.current = false;
    }
  }, [hasPermission]);

  const resetIsVisible = useCallback(() => setShowNotification(undefined), []);
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
      isVisible={!!showNotification}
      visibilityTimeout={visibilityTimeout}
      resetIsVisible={resetIsVisible}
      message={
        showNotification === 'granted' ? messageApproved : messageRevoked
      }
    >
      {children}
    </Notification>
  );
};
