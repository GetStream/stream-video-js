import { useEffect } from 'react';
import { useWebRtcStats } from '../hooks';
import { RoomType } from './Room';

export interface StatsProps {
  room: RoomType;
}

export const Stats = ({ room }: StatsProps) => {
  const webRtcStats = useWebRtcStats(room);
  useEffect(() => {
    const logStats = (stats: object) => {
      console.log(stats);
    };
    webRtcStats.addListener('stats', logStats);
    return () => {
      webRtcStats.removeListener('stats', logStats);
    };
  }, [webRtcStats]);

  return null;
};
