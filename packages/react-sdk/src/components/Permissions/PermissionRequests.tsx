import {
  ButtonHTMLAttributes,
  ComponentProps,
  forwardRef,
  Fragment,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import {
  OwnCapability,
  PermissionRequestEvent,
  StreamVideoEvent,
  UserResponse,
} from '@stream-io/video-client';
import {
  TranslatorFunction,
  useCall,
  useCallStateHooks,
  useHasPermissions,
  useI18n,
} from '@stream-io/video-react-bindings';
import clsx from 'clsx';

import { useFloatingUIPreset } from '../../hooks';

const byNameOrId = (a: UserResponse, b: UserResponse) => {
  if (a.name && b.name && a.name < b.name) return -1;
  if (a.name && b.name && a.name > b.name) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
};

type HandleUpdatePermission = (
  request: PermissionRequestEvent,
  type: 'grant' | 'revoke' | 'dismiss',
) => () => Promise<void>;

export const PermissionRequests = () => {
  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const [expanded, setExpanded] = useState(false);
  const [permissionRequests, setPermissionRequests] = useState<
    PermissionRequestEvent[]
  >([]);
  const canUpdateCallPermissions = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );

  const localUserId = localParticipant?.userId;
  useEffect(() => {
    if (!call || !canUpdateCallPermissions) return;

    const unsubscribe = call.on(
      'call.permission_request',
      (event: StreamVideoEvent) => {
        if (event.type !== 'call.permission_request') return;
        if (event.user.id !== localUserId) {
          setPermissionRequests((requests) =>
            [...requests, event as PermissionRequestEvent].sort((a, b) =>
              byNameOrId(a.user, b.user),
            ),
          );
        }
      },
    );
    return () => {
      unsubscribe();
    };
  }, [call, canUpdateCallPermissions, localUserId]);

  const handleUpdatePermission: HandleUpdatePermission = (request, type) => {
    return async () => {
      const { user, permissions } = request;
      switch (type) {
        case 'grant':
          await call?.grantPermissions(user.id, permissions);
          break;
        case 'revoke':
          await call?.revokePermissions(user.id, permissions);
          break;
        default:
          break;
      }
      setPermissionRequests((requests) =>
        requests.filter((r) => r !== request),
      );
    };
  };

  const { refs, x, y, strategy } = useFloatingUIPreset({
    placement: 'bottom',
    strategy: 'absolute',
  });

  // don't render anything if there are no permission requests
  if (permissionRequests.length === 0) return null;

  return (
    <div className="str-video__permission-requests" ref={refs.setReference}>
      <div className="str-video__permission-requests__notification">
        <span className="str-video__permission-requests__notification__message">
          {permissionRequests.length} pending permission requests
        </span>
        <Button
          type="button"
          onClick={() => {
            setExpanded((e) => !e);
          }}
        >
          {expanded ? 'Hide requests' : 'Show requests'}
        </Button>
      </div>
      {expanded && (
        <PermissionRequestList
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            overflowY: 'auto',
          }}
          permissionRequests={permissionRequests}
          handleUpdatePermission={handleUpdatePermission}
        />
      )}
    </div>
  );
};

export type PermissionRequestListProps = ComponentProps<'div'> & {
  permissionRequests: PermissionRequestEvent[];
  handleUpdatePermission: HandleUpdatePermission;
};

export const PermissionRequestList = forwardRef<
  HTMLDivElement,
  PermissionRequestListProps
>(function PermissionRequestList(props, ref) {
  const { permissionRequests, handleUpdatePermission, ...rest } = props;

  const { t } = useI18n();

  return (
    <div className="str-video__permission-requests-list" ref={ref} {...rest}>
      {permissionRequests.map((request, reqIndex) => {
        const { user, permissions } = request;
        return (
          <Fragment key={`${user.id}/${reqIndex}`}>
            {permissions.map((permission) => (
              <div className="str-video__permission-request" key={permission}>
                <div className="str-video__permission-request__message">
                  {messageForPermission(user.name || user.id, permission, t)}
                </div>
                <Button
                  className="str-video__permission-request__button--allow"
                  type="button"
                  onClick={handleUpdatePermission(request, 'grant')}
                >
                  {t('Allow')}
                </Button>
                <Button
                  className="str-video__permission-request__button--reject"
                  type="button"
                  onClick={handleUpdatePermission(request, 'revoke')}
                >
                  {t('Revoke')}
                </Button>
                <Button
                  className="str-video__permission-request__button--reject"
                  type="button"
                  onClick={handleUpdatePermission(request, 'dismiss')}
                >
                  {t('Dismiss')}
                </Button>
              </div>
            ))}
          </Fragment>
        );
      })}
    </div>
  );
});

const Button = (
  props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>,
) => {
  const { className, ...rest } = props;
  return (
    <button
      className={clsx('str-video__permission-request__button', className)}
      {...rest}
    />
  );
};

const messageForPermission = (
  userName: string,
  permission: string,
  t: TranslatorFunction,
) => {
  switch (permission) {
    case OwnCapability.SEND_AUDIO:
      return t('{{ userName }} is requesting to speak', { userName });
    case OwnCapability.SEND_VIDEO:
      return t('{{ userName }} is requesting to share their camera', {
        userName,
      });
    case OwnCapability.SCREENSHARE:
      return t('{{ userName }} is requesting to present their screen', {
        userName,
      });
    default:
      return t('{{ userName }} is requesting permission: {{ permission }}', {
        userName,
        permission,
      });
  }
};
