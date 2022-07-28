import { useEffect } from 'react';
import { StatsEvent, useWebRtcStats } from '../hooks';
import { RoomType } from './Room';

export interface StatsProps {
  room: RoomType;
}

export const Stats = ({ room }: StatsProps) => {
  const webRtcStats = useWebRtcStats(room);
  useEffect(() => {
    const logStats = (stats: StatsEvent) => {
      const rawStats: { [n: string]: object } = {};
      stats.rawStats?.forEach((v, k) => (rawStats[k] = v));
      console.log(stats, rawStats);
    };
    webRtcStats.addListener('stats', logStats);
    return () => {
      webRtcStats.removeListener('stats', logStats);
    };
  }, [webRtcStats]);

  return null;
};
