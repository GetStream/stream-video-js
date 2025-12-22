import { useCallStateHooks as getCallStateHooks } from '@stream-io/video-react-sdk';

const { useCallCallingState } = getCallStateHooks();

export const CallingState = () => {
  const callingState = useCallCallingState();

  return (
    <div>
      <div>State: {callingState}</div>
    </div>
  );
};
