import {
  useActiveCall,
  useIncomingCalls,
  useLocalParticipant,
  useOutgoingCalls,
  usePendingCalls,
  useRemoteParticipants,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';

import { ParticipantBox, useStage } from '@stream-io/video-react-sdk';

import { CallCreated } from '@stream-io/video-client';

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

      {incomingCall && !activeCall && !outgoingCall && (
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
      {outgoingCall && !activeCall && (
        <button
          onClick={() => videoClient.cancelCall(outgoingCall.call.callCid)}
        >
          Cancel
        </button>
      )}
      {activeCall && (
        <button
          onClick={async () => {
            await videoClient.cancelCall(activeCall.data.call.callCid);
            activeCall.leave();
          }}
        >
          Drop
        </button>
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

  const { updateVideoSubscriptionForParticipant } = useStage(activeCall);

  if (!pendingCalls.length && !activeCall) return null;

  return (
    <div>
      {localParticipant && (
        <div className="floating">
          <ParticipantBox
            participant={localParticipant}
            call={activeCall}
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
          call={activeCall}
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
