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
  useCall,
  useHasPermissions,
  useLocalParticipant,
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

export const PermissionRequests = () => {
  const call = useCall();
  const localParticipant = useLocalParticipant();
  const [expanded, setExpanded] = useState(false);
  const [permissionRequests, setPermissionRequests] = useState<
    PermissionRequestEvent[]
  >([]);
  console.log('permissionRequests', permissionRequests);
  const canUpdateCallPermissions = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );

  useEffect(() => {
    if (!call || !canUpdateCallPermissions) return;

    const unsubscribe = call.on(
      'call.permission_request',
      (event: StreamVideoEvent) => {
        if (event.type !== 'call.permission_request') return;

        if (event.user.id !== localParticipant?.userId) {
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
  }, [call, canUpdateCallPermissions, localParticipant]);

  const handleUpdatePermission = (
    request: PermissionRequestEvent,
    allow: boolean,
  ) => {
    return async () => {
      const { user, permissions } = request;
      if (allow) {
        await call?.grantPermissions(user.id, permissions);
      } else {
        await call?.revokePermissions(user.id, permissions);
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
  handleUpdatePermission: (
    request: PermissionRequestEvent,
    allow: boolean,
  ) => () => Promise<void>;
};

export const PermissionRequestList = forwardRef<
  HTMLDivElement,
  PermissionRequestListProps
>((props, ref) => {
  const { permissionRequests, handleUpdatePermission, ...rest } = props;
  return (
    <div className="str-video__permission-requests-list" ref={ref} {...rest}>
      {permissionRequests.map((request, reqIndex) => {
        const { user, permissions } = request;
        return (
          <Fragment key={`${user.id}/${reqIndex}`}>
            {permissions.map((permission) => (
              <div className="str-video__permission-request" key={permission}>
                <div className="str-video__permission-request__message">
                  {messageForPermission(user.name || user.id, permission)}
                </div>
                <Button
                  className="str-video__permission-request__button--allow"
                  type="button"
                  onClick={handleUpdatePermission(request, true)}
                >
                  Allow
                </Button>
                <Button
                  className="str-video__permission-request__button--reject"
                  type="button"
                  onClick={handleUpdatePermission(request, false)}
                >
                  Reject
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
