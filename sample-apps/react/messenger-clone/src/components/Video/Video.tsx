import { StreamMeeting, useCalls } from '@stream-io/video-react-sdk';

import { CallPanel } from './CallPanel';

export const Video = () => {
  const calls = useCalls();
  return (
    <>
      {calls.map((call) => (
        <StreamMeeting call={call} autoJoin={false} key={call.cid}>
          <CallPanel />
        </StreamMeeting>
      ))}
    </>
  );
};
