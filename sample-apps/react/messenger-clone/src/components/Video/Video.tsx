import { StreamCallProvider, useCalls } from '@stream-io/video-react-sdk';

import { CallPanel } from './CallPanel';

export const Video = () => {
  const calls = useCalls();
  return (
    <>
      {calls.map((call) => (
        <StreamCallProvider call={call} key={call.cid}>
          <CallPanel />
        </StreamCallProvider>
      ))}
    </>
  );
};
