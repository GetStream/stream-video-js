import { PropsWithChildren, useCallback, useEffect } from 'react';
import { RemoteHangupNotification } from '@stream-io/video-client';

import {
  useActiveCall,
  useActiveCallHangUpNotification,
  useIncomingCallHangUpNotification,
  useOutgoingCallHangUpNotification,
  useOutgoingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../contexts';

type StreamCallProps = {
  leaveOnLeftAlone?: boolean;
  leaveOnCreatorLeft?: boolean;
};

export const StreamCall = ({
  children,
  leaveOnLeftAlone,
  leaveOnCreatorLeft,
}: PropsWithChildren<StreamCallProps>) => {
  const videoClient = useStreamVideoClient();
  const [outgoingCall] = useOutgoingCalls();
  const activeCall = useActiveCall();
  const activeCallHangupNotification = useActiveCallHangUpNotification();
  const outgoingCallHangupNotification = useOutgoingCallHangUpNotification();
  const incomingCallHangupNotification = useIncomingCallHangUpNotification();

  useEffect(() => {
    if (!(videoClient && outgoingCall?.call) || activeCall) return;

    videoClient
      ?.joinCall({
        id: outgoingCall.call.id,
        type: outgoingCall.call.type,
        // FIXME: OL optional, but it is marked as required in proto
        datacenterId: '',
      })
      .then((call) => {
        call?.join();
      });
  }, [videoClient, outgoingCall, activeCall]);

  const cancelCallOnRemoteHangup = useCallback(
    ({ hungUpByUsers, targetCall }: RemoteHangupNotification) => {
      if (!videoClient) return;

      const hungUpByCreator =
        !!targetCall.callCreatedBy &&
        hungUpByUsers.has(targetCall.callCreatedBy);
      const isLeftAlone = targetCall.memberUserIds.every((memberId) =>
        hungUpByUsers.has(memberId),
      );
      if (
        (isLeftAlone && leaveOnLeftAlone) ||
        (hungUpByCreator && leaveOnCreatorLeft)
      ) {
        videoClient.cancelCall(targetCall.callCid);
      }
    },
    [videoClient, leaveOnCreatorLeft, leaveOnLeftAlone],
  );

  useEffect(() => {
    if (activeCallHangupNotification) {
      cancelCallOnRemoteHangup(activeCallHangupNotification);
    }
    if (outgoingCallHangupNotification) {
      cancelCallOnRemoteHangup(outgoingCallHangupNotification);
    }
    if (incomingCallHangupNotification) {
      cancelCallOnRemoteHangup(incomingCallHangupNotification);
    }
  }, [
    activeCallHangupNotification,
    outgoingCallHangupNotification,
    incomingCallHangupNotification,
    cancelCallOnRemoteHangup,
  ]);

  if (!videoClient) return null;

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
