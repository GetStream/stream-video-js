import { useEffect } from 'react';
import { Call, CallMeta, StreamVideoClient } from '@stream-io/video-client';

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
          callType: activeCall.type,
          callId: activeCall.id,
          statsJson: getStats(s),
        });
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeCall.id, activeCall.type, call, client]);

  return null;
};
