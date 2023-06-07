import { OwnCapability } from '@stream-io/video-client';
import { useHasPermissions } from '@stream-io/video-react-bindings';
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { usePrevious } from '../utils/hooks/usePrevious';

export type PermissionNotificationProps = {
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
};

export const usePermissionNotification = (
  props: PermissionNotificationProps,
) => {
  const { permission, messageApproved, messageRevoked } = props;
  const hasPermission = useHasPermissions(permission);
  const previousHasPermission = usePrevious(hasPermission);

  const showGrantedNotification = useCallback(() => {
    Alert.alert(messageApproved);
  }, [messageApproved]);

  const showRevokedNotification = useCallback(() => {
    Alert.alert(messageRevoked);
  }, [messageRevoked]);

  useEffect(() => {
    if (hasPermission && !previousHasPermission) {
      showGrantedNotification();
    } else if (!hasPermission && previousHasPermission) {
      showRevokedNotification();
    }
  }, [
    hasPermission,
    previousHasPermission,
    showGrantedNotification,
    showRevokedNotification,
  ]);
};
