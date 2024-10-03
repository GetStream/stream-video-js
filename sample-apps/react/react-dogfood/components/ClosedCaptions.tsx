import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CallClosedCaption,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

const useDeduplicatedQueue = (initialQueue: CallClosedCaption[] = []) => {
  const [queue, setQueue] = useState<CallClosedCaption[]>(initialQueue);

  const addToQueue = useCallback((newCaption: CallClosedCaption) => {
    setQueue((prevQueue) => {
      const key = `${newCaption.speaker_id}-${newCaption.start_time}`;
      const isDuplicate = prevQueue.some(
        (caption) => `${caption.speaker_id}-${caption.start_time}` === key,
      );

      if (isDuplicate) {
        return prevQueue;
      }

      return [...prevQueue, newCaption];
    });
  }, []);

  return [queue, addToQueue, setQueue] as const;
};

export const ClosedCaptions = () => {
  const { useCallClosedCaptions } = useCallStateHooks();
  const closedCaptions = useCallClosedCaptions();
  const userNameMapping = useUserIdToUserNameMapping();

  return (
    <div className="rd__closed-captions">
      {closedCaptions.map(({ speaker_id, text, start_time }) => (
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
    </div>
  );
};

export const ClosedCaptionsSidebar = () => {
  const call = useCall();
  const [queue, addToQueue] = useDeduplicatedQueue();

  useEffect(() => {
    if (!call) return;
    return call.on('call.closed_caption', (e) => {
      addToQueue(e.closed_caption);
    });
  }, [call, addToQueue]);

  const userNameMapping = useUserIdToUserNameMapping();

  return (
    <div className="rd__closed-captions-sidebar">
      <h3>Closed Captions</h3>
      <div className="rd__closed-captions-sidebar__container">
        {queue.map(({ speaker_id, text, start_time }) => (
          <p
            className="rd__closed-captions__line"
            key={`${speaker_id}-${start_time}`}
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
