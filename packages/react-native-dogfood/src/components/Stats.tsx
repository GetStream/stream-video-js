import {
  useActiveCall,
  useActiveRingCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { useEffect } from 'react';

const intervalMs = 15000;

type RTCStatsReport = ReadonlyMap<string, any>;

const getStats = (stats: RTCStatsReport) => {
  const objectFromMap = Object.fromEntries(stats);
  // this is polyfilled

  return new TextEncoder().encode(JSON.stringify(objectFromMap));
};

export const Stats = () => {
  const videoClient = useStreamVideoClient();
  const call = useActiveCall();
  const activeRingCallMeta = useActiveRingCall();

  useEffect(() => {
    if (videoClient && call && activeRingCallMeta) {
      const intervalId = setInterval(async () => {
        const stats = await Promise.all([
          call.getStats('subscriber'),
          call.getStats('publisher'),
        ]);

        for (const s of stats) {
          if (!s) {
            continue;
          }
          try {
            await videoClient.reportCallStats({
              callCid: activeRingCallMeta.callCid,
              statsJson: getStats(s),
            });
          } catch (err) {
            console.log('error reporting stats', err);
          }
        }
      }, intervalMs);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [activeRingCallMeta, call, videoClient]);

  return null;
};
