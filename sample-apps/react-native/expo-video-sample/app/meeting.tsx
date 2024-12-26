import { StreamCall, useCalls } from '@stream-io/video-react-native-sdk';
import { router } from 'expo-router';
import { MeetingUI } from '../components/MeetingUI';
import { useEffect } from 'react';

export default function JoinMeetingScreen() {
  const calls = useCalls().filter((c) => !c.ringing);

  const firstCall = calls[0];

  useEffect(() => {
    if (!firstCall) {
      router.back();
    }
  }, [firstCall]);

  if (!firstCall) {
    return null;
  }

  return (
    <StreamCall call={firstCall}>
      <MeetingUI />
    </StreamCall>
  );
}
