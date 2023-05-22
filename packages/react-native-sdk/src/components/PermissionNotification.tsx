import { AxiosError, OwnCapability } from '@stream-io/video-client';
import { useCall, useHasPermissions } from '@stream-io/video-react-bindings';
import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { usePrevious } from '../utils/usePrevious';

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
  const previousHasPermission = usePrevious(hasPermission);

  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const call = useCall();

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
    if (hasPermission && !previousHasPermission) {
      showGrantedNotification();
    } else if (!hasPermission && previousHasPermission) {
      showRevokedNotification();
    } else if (!hasPermission && isAwaitingApproval) {
      showApprovalRequestNotification();
    }
  }, [
    isAwaitingApproval,
    hasPermission,
    previousHasPermission,
    showGrantedNotification,
    showRevokedNotification,
    showApprovalRequestNotification,
  ]);

  const handleRequestPermission = useCallback(async () => {
    if (call?.permissionsContext.canRequest(permission)) {
      setIsAwaitingApproval(true);
      try {
        await call.requestPermissions({ permissions: [permission] });
      } catch (error) {
        if (error instanceof AxiosError) {
          console.log(
            'RequestPermissions failed',
            error.response?.data.message,
          );
        }
      }
    }
  }, [call, permission]);

  if (!hasPermission && !isAwaitingApproval) {
    return <Pressable onPress={handleRequestPermission}>{children}</Pressable>;
  }

  return <>{children}</>;
};
