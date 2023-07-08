import { useCallback, useEffect, useState } from 'react';
import {
  OwnCapability,
  PermissionRequestEvent,
  StreamCallEvent,
  useCall,
  useCallMetadata,
  useHasPermissions,
} from '@stream-io/video-react-sdk';

export const useSpeakingRequests = () => {
  const call = useCall();
  const metadata = useCallMetadata();
  const canUpdatePermissions = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );
  const [isOpenRequestList, setIsOpenRequestList] = useState(false);

  const [speakingRequests, setSpeakingRequests] = useState<
    PermissionRequestEvent[]
  >([]);

  const dismissSpeakingRequest = useCallback(
    (speakingRequest: PermissionRequestEvent) => {
      const newRequests = speakingRequests.filter(
        (r) => r.user.id !== speakingRequest.user.id,
      );
      setSpeakingRequests(newRequests);
      if (newRequests.length === 0) {
        setIsOpenRequestList(false);
      }
    },
    [speakingRequests],
  );

  const acceptRequest = useCallback(
    async (speakingRequest: PermissionRequestEvent) => {
      if (!(call && metadata?.custom)) return;

      await call?.updateUserPermissions({
        user_id: speakingRequest.user.id,
        grant_permissions: [...speakingRequest.permissions],
      });

      await call?.update({
        custom: {
          ...(metadata?.custom || {}),
          speakerIds: [
            ...(metadata?.custom.speakerIds || []),
            speakingRequest.user.id,
          ],
        },
      });

      dismissSpeakingRequest(speakingRequest);
    },
    [dismissSpeakingRequest, call, metadata?.custom],
  );

  useEffect(() => {
    if (!(call && canUpdatePermissions)) return;
    const unsubscribe = call.on(
      'call.permission_request',
      (event: StreamCallEvent) => {
        if (event.type !== 'call.permission_request') return;

        setSpeakingRequests((prevSpeakingRequests) => [
          ...prevSpeakingRequests,
          event,
        ]);
        setIsOpenRequestList(true);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [call, canUpdatePermissions]);

  return {
    acceptRequest,
    dismissSpeakingRequest,
    isOpenRequestList,
    setIsOpenRequestList,
    speakingRequests,
  };
};
