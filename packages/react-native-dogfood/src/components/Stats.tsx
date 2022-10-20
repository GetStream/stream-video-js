import { useEffect } from 'react';
import { useAppGlobalStore } from '../contexts/AppContext';

const intervalMs = 15000;

type RTCStatsReport = ReadonlyMap<string, any>;

const getStats = (stats: RTCStatsReport) => {
  const objectFromMap = Object.fromEntries(stats);
  // this is polyfilled
  // eslint-disable-next-line no-undef
  return new TextEncoder().encode(JSON.stringify(objectFromMap));
};

export const Stats = () => {
  const [{ videoClient, call, activeCall }] = useAppGlobalStore((store) => ({
    videoClient: store.videoClient,
    call: store.call,
    activeCall: store.activeCall,
  }));
  useEffect(() => {
    if (videoClient && call && activeCall) {
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
              callType: activeCall.type,
              callId: activeCall.id,
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
  }, [activeCall, call, videoClient]);

  return null;
};
