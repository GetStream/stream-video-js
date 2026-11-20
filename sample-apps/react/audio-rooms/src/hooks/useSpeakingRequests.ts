import { useEffect, useState } from 'react';
import {
  OwnCapability,
  PermissionRequestEvent,
  useCall,
  useHasPermissions,
} from '@stream-io/video-react-sdk';

export const useSpeakingRequests = () => {
  const call = useCall();
  const canUpdatePermissions = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );
  const [isOpenRequestList, setIsOpenRequestList] = useState(false);

  const [speakingRequests, setSpeakingRequests] = useState<
    PermissionRequestEvent[]
  >([]);

  function dismissSpeakingRequest(speakingRequest: PermissionRequestEvent) {
    const newRequests = speakingRequests.filter(
      (r) => r.user.id !== speakingRequest.user.id,
    );
    setSpeakingRequests(newRequests);
    if (newRequests.length === 0) {
      setIsOpenRequestList(false);
    }
  }

  useEffect(() => {
    if (!(call && canUpdatePermissions)) return;
    const unsubscribe = call.on('call.permission_request', (event) => {
      setSpeakingRequests((prevSpeakingRequests) => [
        ...prevSpeakingRequests,
        event,
      ]);
      setIsOpenRequestList(true);
    });

    return () => {
      unsubscribe();
    };
  }, [call, canUpdatePermissions]);

  return {
    dismissSpeakingRequest,
    isOpenRequestList,
    setIsOpenRequestList,
    speakingRequests,
  };
};
