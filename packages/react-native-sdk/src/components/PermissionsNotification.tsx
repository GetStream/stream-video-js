import { OwnCapability } from '@stream-io/video-client';
import {
  useActiveCall,
  useHasPermissions,
} from '@stream-io/video-react-bindings';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, Pressable } from 'react-native';

export type PermissionNotificationProps = PropsWithChildren<{
  /**
   * The permission to check for.
   */
  permission: OwnCapability;

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
}>;

export const PermissionNotification = (props: PermissionNotificationProps) => {
  const {
    permission,
    messageApproved,
    messageRevoked,
    messageAwaitingApproval,
    children,
  } = props;
  const hasPermission = useHasPermissions(permission);
  const previousHasPermission = useRef(hasPermission);

  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const call = useActiveCall();

  const showGrantedNotification = useCallback(() => {
    Alert.alert(messageApproved);
  }, [messageApproved]);

  const showRevokedNotification = useCallback(() => {
    Alert.alert(messageRevoked);
  }, [messageRevoked]);

  const showApprovalRequestNotification = useCallback(() => {
    Alert.alert(messageAwaitingApproval);
  }, [messageAwaitingApproval]);

  useEffect(() => {
    if (hasPermission) {
      setIsAwaitingApproval(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    if (hasPermission && !previousHasPermission.current) {
      previousHasPermission.current = true;
      showGrantedNotification();
    } else if (!hasPermission && previousHasPermission.current) {
      previousHasPermission.current = false;
      showRevokedNotification();
    } else if (!hasPermission && isAwaitingApproval) {
      previousHasPermission.current = false;
      showApprovalRequestNotification();
    }
  }, [
    isAwaitingApproval,
    hasPermission,
    showGrantedNotification,
    showRevokedNotification,
    showApprovalRequestNotification,
  ]);

  const handleRequestPermission = useCallback(async () => {
    if (call?.permissionsContext.canRequest(permission)) {
      setIsAwaitingApproval(true);
      await call
        .requestPermissions({ permissions: [permission] })
        .catch((reason) => {
          console.log('RequestPermissions failed', reason);
        });
    }
  }, [call, permission]);

  if (!hasPermission && !isAwaitingApproval) {
    return <Pressable onPress={handleRequestPermission}>{children}</Pressable>;
  }

  return <>{children}</>;
};
