import { StreamCall, useCalls } from '@stream-io/video-react-native-sdk';
import { router } from 'expo-router';
import { MeetingUI } from '../components/MeetingUI';

export default function JoinMeetingScreen() {
  const calls = useCalls().filter((c) => !c.ringing);

  const firstCall = calls[0];

  if (!firstCall) {
    router.back();
    return null;
  }

  return (
    <StreamCall call={firstCall}>
      <MeetingUI />
    </StreamCall>
  );
}
