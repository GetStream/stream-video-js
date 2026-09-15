import React, { useEffect, useMemo, useState } from 'react';
import { useCallStateHooks } from '../..';
import { DurationIndicator } from './DurationIndicator';

const formatTime = (seconds: number) => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const format = date.toISOString();
  const hours = format.substring(11, 13);
  const minutes = format.substring(14, 16);
  const seconds_str = format.substring(17, 19);
  return `${hours !== '00' ? hours + ':' : ''}${minutes}:${seconds_str}`;
};

/**
 * Shows how long the call has been running, together with the recording or
 * screen-share indicator when either is active.
 *
 * Rendering is delegated to {@link DurationIndicator}; this component only
 * tracks the elapsed time and picks the icon.
 */
export const CallDurationIndicator = () => {
  const [elapsed, setElapsed] = useState<string>('00:00');
  const { useCallSession } = useCallStateHooks();

  const session = useCallSession();
  const startedAt = session?.started_at;
  const startedAtMs = useMemo(() => {
    if (!startedAt) {
      return null;
    }
    const date = new Date(startedAt).getTime();
    return isNaN(date) ? null : date;
  }, [startedAt]);

  useEffect(() => {
    const start = startedAtMs ?? Date.now();
    const updateElapsed = () => {
      const elapsedSeconds = Math.max(0, (Date.now() - start) / 1000);
      setElapsed(formatTime(elapsedSeconds));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startedAtMs]);

  return <DurationIndicator duration={elapsed} />;
};
