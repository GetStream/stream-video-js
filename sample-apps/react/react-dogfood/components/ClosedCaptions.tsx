import { useEffect, useMemo, useState } from 'react';
import {
  CallClosedCaption,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export const ClosedCaptions = () => {
  const call = useCall();
  const [queue, setQueue] = useState<CallClosedCaption[]>([]);
  useEffect(() => {
    if (!call) return;
    return call.on('call.closed_caption', (e) => {
      if (e.type !== 'call.closed_caption') return;
      if (e.closed_caption.text.trim() === '') return;
      setQueue((prev) => [...prev.slice(-1), e.closed_caption]);
    });
  }, [call]);

  useEffect(() => {
    const id = setTimeout(() => {
      setQueue(queue.length !== 0 ? queue.slice(1) : queue);
    }, 2700);
    return () => clearTimeout(id);
  }, [queue]);

  const userNameMapping = useUserIdToUserNameMapping();
  return (
    <div className="rd__closed-captions">
      {queue.map(({ speaker_id, text }, index) => (
        <p
          className="rd__closed-captions__line"
          key={speaker_id + index + text}
        >
          <span className="rd__closed-captions__speaker">
            {userNameMapping[speaker_id] || speaker_id}:
          </span>
          <span className="rd__closed-captions__text"> {text}</span>
        </p>
      ))}
    </div>
  );
};

export const ClosedCaptionsSidebar = () => {
  const call = useCall();
  const [queue, setQueue] = useState<CallClosedCaption[]>([]);
  useEffect(() => {
    if (!call) return;
    return call.on('call.closed_caption', (e) => {
      if (e.type !== 'call.closed_caption') return;
      if (e.closed_caption.text.trim() === '') return;
      setQueue((prev) => [...prev, e.closed_caption]);
    });
  }, [call]);

  const userNameMapping = useUserIdToUserNameMapping();
  return (
    <div className="rd__closed-captions-sidebar">
      <h3>Closed Captions</h3>
      <div className="rd__closed-captions-sidebar__container">
        {queue.map(({ speaker_id, text }, index) => (
          <p
            className="rd__closed-captions__line"
            key={speaker_id + index + text}
          >
            <span className="rd__closed-captions__speaker">
              {userNameMapping[speaker_id] || speaker_id}:
            </span>
            <span className="rd__closed-captions__text"> {text}</span>
          </p>
        ))}
      </div>
    </div>
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
