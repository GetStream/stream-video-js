import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActiveCall,
  ActiveCallProps,
  StreamVideoRN,
  useCall,
} from '@stream-io/video-react-native-sdk';
import { GuestModeParamList } from '../../../types';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '@stream-io/video-react-native-sdk/dist/src/theme';
import { ParticipantListButtons } from '../../components/ParticipantListButtons';
import {
  startForegroundService,
  stopForegroundService,
} from '../../modules/push/android';

type Props = NativeStackScreenProps<GuestModeParamList, 'GuestMeetingScreen'>;
type Mode = NonNullable<ActiveCallProps['mode']>;

export const GuestMeetingScreen = ({ navigation }: Props) => {
  const [selectedMode, setMode] = React.useState<Mode>('grid');

  const activeCall = useCall();

  useEffect(() => {
    if (!activeCall) {
      return;
    }
    startForegroundService();
    return () => {
      stopForegroundService();
    };
  }, [activeCall]);

  const onOpenCallParticipantsInfoViewHandler = () => {
    navigation.navigate('GuestCallParticipantsInfoScreen');
  };

  StreamVideoRN.setConfig({
    onOpenCallParticipantsInfoView: onOpenCallParticipantsInfoViewHandler,
  });

  return (
    <SafeAreaView style={styles.wrapper}>
      <ParticipantListButtons selectedMode={selectedMode} setMode={setMode} />
      <ActiveCall mode={selectedMode} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
});
