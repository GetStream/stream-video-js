import React from 'react';
import { Call } from '@stream-io/video-react-native-sdk';
import Room from './Room';
import JoinAudioRoom from './JoinRoom';

export default function AudioRoom() {
  const [call, setCall] = React.useState<Call>();

  if (call) {
    return <Room call={call} />;
  }

  return <JoinAudioRoom setCall={setCall} />;
}
