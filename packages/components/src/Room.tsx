import * as React from 'react';
import { LiveKitRoom } from '@livekit/react-components';
import type { Room as LiveKitRoomType } from 'livekit-client';

export type RoomProps = {
  url: string;
  token: string;
  onConnected?: (room: LiveKitRoomType) => void;
};

export type RoomType = LiveKitRoomType;

export const Room = (props: RoomProps) => {
  const { url, token, onConnected } = props;
  return (
    <div className="roomContainer">
      <LiveKitRoom url={url} token={token} onConnected={onConnected} />
    </div>
  );
};
