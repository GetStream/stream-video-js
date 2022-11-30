import { useMemo } from 'react';
import {
  useActiveCall,
  useParticipants,
  usePendingCalls,
  useRemoteParticipants,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { ActiveCall } from './ActiveCall';
import { RingingCallPanel } from './RingingPanel';

export const CallPanel = () => {
  const videoClient = useStreamVideoClient();
  const pendingCalls = usePendingCalls();
  const activeCall = useActiveCall();
  const remoteParticipants = useRemoteParticipants();
  const participants = useParticipants();

  const memberList = useMemo(() => {
    return activeCall?.data?.callDetails.members
      ? Object.values(activeCall.data.callDetails.members)
      : [];
  }, [activeCall]);

  const callCid = activeCall?.data?.call?.callCid;

  if (remoteParticipants.length > 1) {
  }
  if (activeCall?.data && activeCall?.connection) {
    // show stage video;
    return (
      <ActiveCall
        callData={activeCall.data}
        callController={activeCall.connection}
        participants={participants}
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
