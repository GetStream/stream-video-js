import { useEffect, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { Icon } from '../../components';

/**
 * Displays the elapsed call duration as HH:MM:SS or MM:SS with a verified icon.
 */
export const CallDuration = () => {
  const { useCallStartedAt } = useCallStateHooks();
  const startedAt = useCallStartedAt();
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) return;

    const update = () => {
      const seconds = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 1000,
      );
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      setElapsed(
        h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`,
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;

  return (
    <div className="str-video__embedded-call-duration">
      <Icon
        icon="verified"
        className="str-video__embedded-call-duration__icon"
      />
      <span className="str-video__embedded-call-duration__time">{elapsed}</span>
    </div>
  );
};
