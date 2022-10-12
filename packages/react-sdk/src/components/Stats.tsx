import {
  Call,
  CallMeta,
  StreamVideoClient,
  TrackChangedListener,
} from '@stream-io/video-client';
import { useEffect } from 'react';

export interface StatsProps {
  client: StreamVideoClient;
  call: Call;
  activeCall: CallMeta.Call;
}

const intervalMs = 15000;

const getStats = (stats: RTCStatsReport) => {
  const s: Record<string, any> = {};
  stats.forEach((v) => {
    s[v.id] = v;
  });

  return new TextEncoder().encode(JSON.stringify(s));
};

export const Stats = ({ client, call, activeCall }: StatsProps) => {
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const stats = await Promise.all([
        call.getStats('subscriber'),
        call.getStats('publisher'),
      ]);

      for (const s of stats) {
        if (!s) continue;
        await client.reportCallStats({
          callCid: activeCall.callCid,
          statsJson: getStats(s),
        });
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeCall.callCid, activeCall.id, activeCall.type, call, client]);

  useEffect(() => {
    call.onTrackChanged(handleTrackChanged);
    return () => call.offTrackChanged(handleTrackChanged);
  }, [call]);

  const handleTrackChanged: TrackChangedListener = (track, change) => {
    console.log('TRACK CHANGED', track, change);
  };

  return null;
};
