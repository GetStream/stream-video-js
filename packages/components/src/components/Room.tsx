import { useState } from 'react';
import { DisplayContext, LiveKitRoom } from '@livekit/react-components';
import type { Room as LiveKitRoomType } from 'livekit-client';

import { Stats } from './Stats';

import '@livekit/react-components/dist/index.css';

export type RoomProps = {
  url: string;
  token: string;
  onConnected?: (room: LiveKitRoomType) => void;
  onLeave?: (room: LiveKitRoomType) => void;
  publishStats?: boolean;
};

export type RoomType = LiveKitRoomType;

export const Room = (props: RoomProps) => {
  const { url, token, onConnected, onLeave, publishStats } = props;
  const [liveKitRoom, setLiveKitRoom] = useState<LiveKitRoomType | undefined>();

  return (
    <div className="str-video__room">
      <DisplayContext.Provider value={{ stageLayout: 'grid', showStats: true }}>
        <LiveKitRoom
          url={url}
          token={token}
          roomOptions={{ adaptiveStream: true, dynacast: true }}
          onLeave={(room) => {
            if (onLeave) {
              onLeave(room);
            }
            setLiveKitRoom(undefined);
          }}
          onConnected={(room) => {
            setLiveKitRoom(room);
            if (onConnected) {
              onConnected(room);
            }
          }}
        />
        {publishStats && liveKitRoom && <Stats room={liveKitRoom} />}
      </DisplayContext.Provider>
    </div>
  );
};
