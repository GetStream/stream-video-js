import { useEffect, useState } from 'react';
import { Call } from '@stream-io/video-client';

export const useRtcStats = (
  call: Call,
  kind: 'subscriber' | 'publisher',
  mediaStream?: MediaStream,
) => {
  const [stats, setStats] = useState<Record<string, string>>();
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const [track] = mediaStream?.getVideoTracks() ?? [];
      const publisherStats = await call.getStats(kind, track);
      const decodedStats: Record<string, string> = {};
      publisherStats?.forEach((s) => {
        decodedStats[s.id] = s;
      });
      setStats(decodedStats);
    }, 1500);

    return () => {
      clearInterval(intervalId);
    };
  }, [call, kind, mediaStream]);

  return stats;
};
