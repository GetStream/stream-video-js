import { useEffect } from 'react';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { useObservableValue } from '../hooks/useObservable';
import { useStore } from '../hooks/useStore';

const intervalMs = 15000;

type RTCStatsReport = ReadonlyMap<string, any>;

const getStats = (stats: RTCStatsReport) => {
  const objectFromMap = Object.fromEntries(stats);
  // this is polyfilled

  return new TextEncoder().encode(JSON.stringify(objectFromMap));
};

export const Stats = () => {
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const { activeCall$, activeRingCallMeta$ } = useStore();
  const call = useObservableValue(activeCall$);
  const activeRingCallMeta = useObservableValue(activeRingCallMeta$);

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
