import {
  StreamVideoClient,
  Struct,
  CallMeta,
  Call,
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
  return Struct.fromJson(s);
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
          stats: getStats(s),
        });
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeCall.id, activeCall.type, call, client]);

  return null;
};
