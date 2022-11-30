import { useMemo, useEffect } from 'react';
import {
  useActiveCall,
  useLocalParticipant,
  useRemoteParticipants,
  usePendingCalls,
  useStreamVideoClient,
  useIncomingCalls,
  useOutgoingCalls,
} from '@stream-io/video-react-bindings';

import { ParticipantBox, useStage } from '@stream-io/video-react-sdk';

import { CallCreated } from '@stream-io/video-client';
// import { RingingCallPanel } from './RingingPanel';

const ButtonControls = ({
  incomingCall,
  outgoingCall,
}: Record<'incomingCall' | 'outgoingCall', CallCreated>) => {
  const videoClient = useStreamVideoClient();

  const activeCall = useActiveCall();

  return (
    <div>
      {incomingCall && 'incoming'}
      {outgoingCall && 'outgoing'}

      {incomingCall && !activeCall?.connection && !outgoingCall && (
        <>
          <button
            onClick={() => videoClient.acceptCall(incomingCall.call.callCid)}
          >
            Accept
          </button>
          <button
            onClick={() => videoClient.rejectCall(incomingCall.call.callCid)}
          >
            Reject
          </button>
        </>
      )}
      {outgoingCall && !activeCall?.connection && (
        <button
          onClick={() => videoClient.cancelCall(outgoingCall.call.callCid)}
        >
          Cancel
        </button>
      )}
      {activeCall?.connection && (
        <button onClick={activeCall.connection.leave}>Drop</button>
      )}
    </div>
  );
};

export const CallPanel = () => {
  const pendingCalls = usePendingCalls();
  const activeCall = useActiveCall();
  const [remoteParticipant] = useRemoteParticipants();
  const localParticipant = useLocalParticipant();

  const [incomingCall] = useIncomingCalls();
  const [outgoingCall] = useOutgoingCalls();

  // const isOutgoing = !activeCall.connection && outgoingCall && !localParticipant;
  // const isIncoming = !localParticipant && incomingCall;

  const { updateVideoSubscriptionForParticipant } = useStage(
    activeCall?.connection,
  );

  if (!pendingCalls.length && !activeCall?.connection) return null;

  return (
    <div>
      {localParticipant && (
        <div className="floating">
          <ParticipantBox
            participant={localParticipant}
            call={activeCall.connection}
            updateVideoSubscriptionForParticipant={
              updateVideoSubscriptionForParticipant
            }
          />
        </div>
      )}
      {!localParticipant && <div>LocalAvatar</div>}

      {remoteParticipant && (
        <ParticipantBox
          participant={remoteParticipant}
          call={activeCall.connection}
          updateVideoSubscriptionForParticipant={
            updateVideoSubscriptionForParticipant
          }
        />
      )}
      {!remoteParticipant && <div>RemoteAvatar</div>}

      <ButtonControls incomingCall={incomingCall} outgoingCall={outgoingCall} />
    </div>
  );
};
