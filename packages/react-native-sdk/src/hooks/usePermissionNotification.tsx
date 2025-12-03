import { CallingState, OwnCapability } from '@stream-io/video-client';
import {
  getCallStateHooks,
  useEffectEvent,
} from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
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

const { useCallCallingState, useHasPermissions } = getCallStateHooks();
export const usePermissionNotification = (
  props: PermissionNotificationProps,
) => {
  const { permission, messageApproved, messageRevoked } = props;
  const hasPermission = useHasPermissions(permission);
  const previousHasPermission = usePrevious(hasPermission);
  const callingState = useCallCallingState();

  const showGrantedNotification = useEffectEvent(() => {
    Alert.alert(messageApproved);
  });

  const showRevokedNotification = useEffectEvent(() => {
    Alert.alert(messageRevoked);
  });

  useEffect(() => {
    // Permission state is not reliable before the call is joined,
    // hence we only check whether to show the notification only when the call is actively joined.
    if (callingState !== CallingState.JOINED) {
      return;
    }
    if (hasPermission && !previousHasPermission) {
      showGrantedNotification();
    } else if (!hasPermission && previousHasPermission) {
      showRevokedNotification();
    }
  }, [callingState, hasPermission, previousHasPermission]);
};
