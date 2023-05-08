import React, { useEffect } from 'react';
import {
  ActiveCall,
  ActiveCallProps,
  theme,
  useCall,
  useIncomingCalls,
} from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { RingingStackParamList } from '../../../types';
import { callkeepCallId$ } from '../../hooks/useCallkeepEffect';
import {
  startForegroundService,
  stopForegroundService,
} from '../../modules/push/android';
import { ParticipantListButtons } from '../../components/ParticipantListButtons';

type Props = NativeStackScreenProps<RingingStackParamList, 'CallScreen'>;
type Mode = NonNullable<ActiveCallProps['mode']>;

export const CallScreen = ({ navigation }: Props) => {
  const call = useCall();
  const [incomingCall] = useIncomingCalls();
  const [selectedMode, setMode] = React.useState<Mode>('grid');

  useEffect(() => {
    // effect to answer call when incoming call is received from callkeep
    if (!incomingCall) {
      return;
    }
    const subscription = callkeepCallId$.subscribe((callkeepCallId) => {
      if (!callkeepCallId || !call) {
        return;
      }
      // TODO: check if callId is the same call as incoming call
      call.join();
      callkeepCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
    });
    return () => subscription.unsubscribe();
  }, [call, incomingCall]);

  useEffect(() => {
    if (!call) {
      return;
    }
    startForegroundService();
    return () => {
      stopForegroundService();
    };
  }, [call]);

  const onOpenCallParticipantsInfoViewHandler = () => {
    navigation.navigate('CallParticipantsInfoScreen');
  };

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <SafeAreaView style={styles.wrapper}>
      <ParticipantListButtons selectedMode={selectedMode} setMode={setMode} />
      <ActiveCall
        onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoViewHandler}
        mode={selectedMode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
});
