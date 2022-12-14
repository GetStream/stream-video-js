import { PropsWithChildren, useEffect } from 'react';
import { RemoteHangupNotification } from '@stream-io/video-client';

import {
  useActiveCall,
  useOutgoingCalls,
  useStore,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { MediaDevicesProvider } from '../../contexts';

type StreamCallProps = {
  leaveOnLeftAlone?: boolean;
};

export const StreamCall = ({
  children,
  leaveOnLeftAlone,
}: PropsWithChildren<StreamCallProps>) => {
  const videoClient = useStreamVideoClient();
  const [outgoingCall] = useOutgoingCalls();
  const activeCall = useActiveCall();
  const {
    activeCallHangupNotifications$,
    outgoingCallHangupNotifications$,
    incomingCallHangupNotifications$,
  } = useStore();

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

  useEffect(() => {
    if (!videoClient) return;
    const cancelCallOnRemoteHangup = ({
      hangups,
      targetCall,
    }: RemoteHangupNotification) => {
      const hungUpByCreator =
        !!targetCall.callCreatedBy && hangups.has(targetCall.callCreatedBy);
      const isLeftAlone = targetCall.memberUserIds.every((memberId) =>
        hangups.has(memberId),
      );
      if (isLeftAlone || hungUpByCreator) {
        videoClient.cancelCall(targetCall.callCid);
      }
    };

    const activeCallHangupsSubscription =
      activeCallHangupNotifications$.subscribe(cancelCallOnRemoteHangup);

    const outgoingCallHangupsSubscription =
      outgoingCallHangupNotifications$.subscribe(cancelCallOnRemoteHangup);

    const incomingCallHangupsSubscription =
      incomingCallHangupNotifications$.subscribe(cancelCallOnRemoteHangup);
    return () => {
      activeCallHangupsSubscription.unsubscribe();
      outgoingCallHangupsSubscription.unsubscribe();
      incomingCallHangupsSubscription.unsubscribe();
    };
  }, [
    videoClient,
    activeCallHangupNotifications$,
    outgoingCallHangupNotifications$,
    incomingCallHangupNotifications$,
  ]);

  if (!videoClient) return null;

  return <MediaDevicesProvider>{children}</MediaDevicesProvider>;
};
