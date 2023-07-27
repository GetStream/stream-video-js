import { OwnCapability, PermissionRequestEvent } from '@stream-io/video-client';
import { useCall, useHasPermissions } from '@stream-io/video-react-bindings';
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';

export const usePermissionRequest = () => {
  const call = useCall();

  const userHasUpdateCallPermissionsCapability = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );

  const messageForPermission = (userName: string, permission: string) => {
    switch (permission) {
      case OwnCapability.SEND_AUDIO:
        return `${userName} is requesting to speak`;
      case OwnCapability.SEND_VIDEO:
        return `${userName} is requesting to share their camera`;
      case OwnCapability.SCREENSHARE:
        return `${userName} is requesting to present their screen`;
      default:
        return `${userName} is requesting permission: ${permission}`;
    }
  };

  const handleUpdatePermission = useCallback(
    (request: PermissionRequestEvent, allow: boolean) => {
      return async () => {
        const { user, permissions } = request;
        try {
          if (allow) {
            await call?.grantPermissions(user.id, permissions);
          } else {
            await call?.revokePermissions(user.id, permissions);
          }
        } catch (err) {
          console.log(err);
        }
      };
    },
    [call],
  );

  useEffect(() => {
    if (!call || !userHasUpdateCallPermissionsCapability) {
      return;
    }
    // do not show permission requests as dialogs for audio rooms
    // in the tutorial, we show a custom list UI for permission requests
    if (call.type === 'audio_room') {
      return;
    }
    return call.on('call.permission_request', (event) => {
      if (event.type !== 'call.permission_request') {
        return;
      }
      const { user, permissions } = event;
      permissions.forEach((permission) => {
        return Alert.alert(
          'Permissions Request',
          messageForPermission(user.name ?? user.id, permission),
          [
            {
              text: 'Reject',
              onPress: handleUpdatePermission(event, false),
            },
            {
              text: 'Allow',
              onPress: handleUpdatePermission(event, true),
            },
          ],
        );
      });
    });
  }, [call, userHasUpdateCallPermissionsCapability, handleUpdatePermission]);
};
