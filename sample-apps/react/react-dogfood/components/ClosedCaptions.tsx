import { useEffect, useMemo, useState } from 'react';
import {
  CallClosedCaption,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export const ClosedCaptions = () => {
  const { useCallClosedCaptions } = useCallStateHooks();
  const closedCaptions = useCallClosedCaptions();
  const userNameMapping = useUserIdToUserNameMapping();
  return (
    <div className="rd__closed-captions">
      <ClosedCaptionList
        queue={closedCaptions}
        userNameMapping={userNameMapping}
      />
    </div>
  );
};

export const ClosedCaptionsSidebar = () => {
  const call = useCall();
  const userNameMapping = useUserIdToUserNameMapping();
  const [queue, addToQueue] = useState<CallClosedCaption[]>([]);
  useEffect(() => {
    if (!call) return;
    return call.on('call.closed_caption', (e) => {
      addToQueue((q) => [...q, e.closed_caption]);
    });
  }, [call]);
  return (
    <div className="rd__closed-captions-sidebar">
      <h3>Closed Captions</h3>
      <div className="rd__closed-captions-sidebar__container">
        <ClosedCaptionList queue={queue} userNameMapping={userNameMapping} />
      </div>
    </div>
  );
};

const ClosedCaptionList = (props: {
  queue: CallClosedCaption[];
  userNameMapping: ReturnType<typeof useUserIdToUserNameMapping>;
}) => {
  const { queue, userNameMapping } = props;
  return (
    <>
      {queue.map(({ speaker_id, text, start_time }) => (
        <p
          className="rd__closed-captions__line"
          key={`${speaker_id}-${start_time}`}
        >
          <span className="rd__closed-captions__speaker">
            {userNameMapping[speaker_id] || speaker_id}:
          </span>
          <span className="rd__closed-captions__text">{text}</span>
        </p>
      ))}
    </>
  );
};

const useUserIdToUserNameMapping = () => {
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();
  return useMemo(() => {
    if (!session) return {};
    return session.participants.reduce<Record<string, string | undefined>>(
      (result, participant) => {
        result[participant.user.id] = participant.user.name;
        return result;
      },
      {},
    );
  }, [session]);
};
