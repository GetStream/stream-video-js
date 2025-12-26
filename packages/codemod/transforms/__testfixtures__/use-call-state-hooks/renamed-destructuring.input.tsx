import { useCallStateHooks } from '@stream-io/video-react-sdk';

export const MyComponent = () => {
  const {
    useCallCallingState: getCallingState,
    useParticipants: getParticipants,
  } = useCallStateHooks();
  const callingState = getCallingState();
  const participants = getParticipants();

  return (
    <div>
      <div>State: {callingState}</div>
      <div>Participants: {participants.length}</div>
    </div>
  );
};
