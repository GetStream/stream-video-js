import React from 'react';
import { Call, StreamCall } from '@stream-io/video-react-native-sdk';
import Room from './Room';
import RoomList from './RoomList';

export default function AudioRoom() {
  const [call, setCall] = React.useState<Call>();

  if (call) {
    return (
      <StreamCall call={call}>
        <Room onClose={() => setCall(undefined)} />
      </StreamCall>
    );
  }

  return <RoomList setCall={setCall} />;
}
