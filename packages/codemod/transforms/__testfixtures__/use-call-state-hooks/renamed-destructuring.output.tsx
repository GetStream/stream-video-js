import { useCallStateHooks as getCallStateHooks } from '@stream-io/video-react-sdk';

const {
  useCallCallingState: getCallingState,
  useParticipants: getParticipants,
} = getCallStateHooks();

export const MyComponent = () => {
  const callingState = getCallingState();
  const participants = getParticipants();

  return (
    <div>
      <div>State: {callingState}</div>
      <div>Participants: {participants.length}</div>
    </div>
  );
};
