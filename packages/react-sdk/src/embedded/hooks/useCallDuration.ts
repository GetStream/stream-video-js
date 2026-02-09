import { useEffect, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

const formatElapsed = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/**
 * Returns the call start time and a live-updating formatted elapsed duration string.
 */
export const useCallDuration = () => {
  const { useCallStartedAt } = useCallStateHooks();
  const startedAt = useCallStartedAt();
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) return;

    const update = () => {
      const seconds = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 1000,
      );
      setElapsed(formatElapsed(seconds));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return { startedAt, elapsed };
};
