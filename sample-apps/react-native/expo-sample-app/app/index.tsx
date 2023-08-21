import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
import { MeetingUI } from '../components/MeetingUI';

export default function App() {
  const client = useStreamVideoClient();
  const callID = '5KEiKhmT8Dnl';
  const callType = 'default';

  const call = useMemo<Call | undefined>(() => {
    if (!client) {
      return undefined;
    }
    return client.call(callType, callID);
  }, [callID, callType, client]);

  if (!call) return <ActivityIndicator />;

  return (
    <StreamCall call={call}>
      <MeetingUI />
    </StreamCall>
  );
}
