import {
  CallingState,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { Button, Text } from 'react-native';

export const MeetingUI = () => {
  const call = useCall();

  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  const onJoinCallHandler = async () => {
    try {
      console.log(call?.id);
      await call?.join({ create: true });
    } catch (error) {
      console.log(error);
    }
  };

  if (callingState === CallingState.IDLE) {
    return <Button title="Join" onPress={onJoinCallHandler} />;
  }
  if (callingState !== CallingState.JOINED) {
    return <Text style={{ fontSize: 30, color: 'black' }}>Loading...</Text>;
  }
  return (
    <Text style={{ fontSize: 30, color: 'black' }}>
      Call "{call?.id}" has {participantCount} participants
    </Text>
  );
};
