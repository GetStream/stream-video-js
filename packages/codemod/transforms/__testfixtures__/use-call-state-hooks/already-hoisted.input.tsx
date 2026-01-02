import { useCallStateHooks as getCallStateHooks } from '@stream-io/video-react-sdk';

const { useCallCallingState, useParticipants } = getCallStateHooks();

export const MyComponent = () => {
  const callingState = useCallCallingState();
  const participants = useParticipants();

  return (
    <div>
      <div>State: {callingState}</div>
      <div>Participants: {participants.length}</div>
    </div>
  );
};
