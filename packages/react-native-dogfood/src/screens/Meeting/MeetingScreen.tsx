import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActiveCall, useActiveCall } from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '@stream-io/video-react-native-sdk/dist/src/theme';
import {
  startForegroundService,
  stopForegroundService,
} from '../../modules/push/android';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = ({ navigation }: Props) => {
  const onOpenCallParticipantsInfoViewHandler = () => {
    navigation.navigate('CallParticipantsInfoScreen');
  };

  const activeCall = useActiveCall();

  useEffect(() => {
    if (!activeCall) {
      return;
    }
    startForegroundService();
    return () => {
      stopForegroundService();
    };
  }, [activeCall]);

  return (
    <SafeAreaView style={styles.wrapper}>
      <ActiveCall
        onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoViewHandler}
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
