import { useEffect, useMemo, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

const formatElapsed = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/**
 * Returns the call session start time and a live-updating formatted elapsed duration string.
 * Uses session.started_at so the timer persists across reconnections.
 */
export const useCallDuration = () => {
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();
  const startedAt = session?.started_at;

  const startedAtDate = useMemo(
    () => (startedAt ? new Date(startedAt).getTime() : undefined),
    [startedAt],
  );

  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAtDate) return;

    const update = () => {
      const seconds = Math.floor((Date.now() - startedAtDate) / 1000);
      setElapsed(formatElapsed(seconds));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAtDate]);

  return { startedAt, elapsed };
};
