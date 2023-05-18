import { StreamCall, useCalls } from '@stream-io/video-react-sdk';

import { CallPanel } from './CallPanel';

export const Video = () => {
  const calls = useCalls();
  return (
    <>
      {calls.map((call) => (
        <StreamCall call={call} autoJoin={false} key={call.cid}>
          <CallPanel />
        </StreamCall>
      ))}
    </>
  );
};
