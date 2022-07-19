import * as React from 'react';
import { DisplayContext, LiveKitRoom } from '@livekit/react-components';
import type { Room as LiveKitRoomType } from 'livekit-client';

import '@livekit/react-components/dist/index.css';

export type RoomProps = {
  url: string;
  token: string;
  onConnected?: (room: LiveKitRoomType) => void;
};

export type RoomType = LiveKitRoomType;

export const Room = (props: RoomProps) => {
  const { url, token, onConnected } = props;
  return (
    <div className="str-video__room">
      <DisplayContext.Provider value={{ stageLayout: 'grid', showStats: true }}>
        <LiveKitRoom
          url={url}
          token={token}
          onConnected={onConnected}
          roomOptions={{ adaptiveStream: true }}
        />
      </DisplayContext.Provider>
    </div>
  );
};
