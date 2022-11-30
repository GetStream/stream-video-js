import {
  useObservableValue,
  useStore,
} from '@stream-io/video-react-sdk/dist/src/hooks/useStore';
import { useMemo } from 'react';
import {
  useActiveCall,
  useRemoteParticipants,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { ActiveCall } from './ActiveCall';
import { RingingCallPanel } from './RingingPanel';

export const CallPanel = () => {
  const videoClient = useStreamVideoClient();
  const { pendingCalls$ } = useStore();
  const pendingCalls = useObservableValue(pendingCalls$);
  const activeCall = useActiveCall();
  const remoteParticipants = useRemoteParticipants();

  const memberList = useMemo(() => {
    return activeCall?.data?.callDetails.members
      ? Object.values(activeCall.data.callDetails.members)
      : [];
  }, [activeCall]);

  const callCid = activeCall?.data?.call?.callCid;
  console.log('CallPanel activeCall', activeCall);
  if (remoteParticipants.length > 1) {
  }
  if (activeCall?.data && activeCall?.connection) {
    // show stage video;
    return (
      <ActiveCall
        callData={activeCall.data}
        callController={activeCall.connection}
      />
    );
  } else if (activeCall?.data) {
    // show outgoing ring call
    return (
      <RingingCallPanel
        hangUp={() => videoClient.cancelCall(callCid)}
        memberList={memberList}
      />
    );
  } else if (pendingCalls.length) {
    // show incoming ring call
    // todo: memeberList has to come from pendingCalls
    return (
      <RingingCallPanel
        accept={() => videoClient.acceptCall(callCid)}
        hangUp={() => videoClient.cancelCall(callCid)}
        memberList={memberList}
      />
    );
  }

  return null;
};
