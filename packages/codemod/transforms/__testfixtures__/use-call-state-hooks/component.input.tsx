import { useCallStateHooks } from '@stream-io/video-react-sdk';

export const CallingState = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  return (
    <div>
      <div>State: {callingState}</div>
    </div>
  );
};
