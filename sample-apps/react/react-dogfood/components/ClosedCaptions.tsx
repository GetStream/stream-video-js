import { useEffect, useState } from 'react';
import { CallClosedCaption, useCall } from '@stream-io/video-react-sdk';

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
    const interval = setInterval(() => {
      setQueue((prev) => (prev.length !== 0 ? prev.slice(1) : prev));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rd__closed-captions">
      {queue.map(({ speaker_id, text }, index) => (
        <p
          className="rd__closed-captions__line"
          key={speaker_id + index + text}
        >
          <span className="rd__closed-captions__speaker">{speaker_id}:</span>
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

  return (
    <div className="rd__closed-captions-sidebar">
      <h3>Closed Captions</h3>
      <div className="rd__closed-captions-sidebar__container">
        {queue.map(({ speaker_id, text }, index) => (
          <p
            className="rd__closed-captions__line"
            key={speaker_id + index + text}
          >
            <span className="rd__closed-captions__speaker">{speaker_id}:</span>
            <span className="rd__closed-captions__text"> {text}</span>
          </p>
        ))}
      </div>
    </div>
  );
};
