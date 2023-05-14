import { OwnCapability, PermissionRequestEvent } from '@stream-io/video-client';
import { useCall, useHasPermissions } from '@stream-io/video-react-bindings';
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';

export const PermissionRequests = () => {
  const call = useCall();

  const canUpdateCallPermissions = useHasPermissions(
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
        console.log({ allow, user, permissions });
        if (allow) {
          await call?.grantPermissions(user.id, permissions);
        } else {
          await call?.revokePermissions(user.id, permissions);
        }
      };
    },
    [call],
  );

  useEffect(() => {
    if (!call || !canUpdateCallPermissions) return;
    return call.on('call.permission_request', (event) => {
      if (event.type !== 'call.permission_request') return;
      const { user, permissions } = event;
      permissions.map((permission) => {
        return Alert.alert(
          'Permissions Request',
          messageForPermission(user.name || user.id, permission),
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
  }, [call, canUpdateCallPermissions, handleUpdatePermission]);

  return <></>;
};
