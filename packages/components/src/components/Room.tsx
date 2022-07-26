import { useEffect, useState } from 'react';
import { DisplayContext, LiveKitRoom } from '@livekit/react-components';
import { useWebRtcStats } from '../hooks';

import type { Room as LiveKitRoomType } from 'livekit-client';
import '@livekit/react-components/dist/index.css';

export type RoomProps = {
  url: string;
  token: string;
  onConnected?: (room: LiveKitRoomType) => void;
  publishStats?: boolean;
};

export type RoomType = LiveKitRoomType;

export const Room = (props: RoomProps) => {
  const { url, token, onConnected, publishStats } = props;
  const [liveKitRoom, setLiveKitRoom] = useState<LiveKitRoomType | undefined>();

  const webRtcStats = useWebRtcStats(liveKitRoom);
  useEffect(() => {
    if (!publishStats) return;
    const logStats = (stats: object) => {
      console.log(stats);
    };
    webRtcStats.addListener('stats', logStats);
    return () => {
      if (!publishStats) return;
      webRtcStats.removeListener('stats', logStats);
    };
  }, [publishStats, webRtcStats]);

  return (
    <div className="str-video__room">
      <DisplayContext.Provider value={{ stageLayout: 'grid', showStats: true }}>
        <LiveKitRoom
          url={url}
          token={token}
          onConnected={(room) => {
            setLiveKitRoom(room);
            if (onConnected) {
              onConnected(room);
            }
          }}
          roomOptions={{ adaptiveStream: true }}
        />
      </DisplayContext.Provider>
    </div>
  );
};
