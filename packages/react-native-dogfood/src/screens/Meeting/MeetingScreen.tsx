import React, { useCallback, useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActiveCall,
  ActiveCallProps,
  ReactionModal,
  StreamVideoRN,
  useCall,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '@stream-io/video-react-native-sdk/dist/src/theme';
import { ParticipantListButtons } from '../../components/ParticipantListButtons';
import {
  startForegroundService,
  stopForegroundService,
} from '../../modules/push/android';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;
type Mode = NonNullable<ActiveCallProps['mode']>;

export const MeetingScreen = ({ navigation }: Props) => {
  const [reactionModal, setReactionModal] = useState<boolean>(false);
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
    navigation.navigate('CallParticipantsInfoScreen');
  };

  const onOpenReactionsModalHandler = useCallback(() => {
    setReactionModal(true);
  }, [setReactionModal]);

  StreamVideoRN.setConfig({
    onOpenCallParticipantsInfoView: onOpenCallParticipantsInfoViewHandler,
    onOpenReactionsModal: onOpenReactionsModalHandler,
  });

  return (
    <SafeAreaView style={styles.wrapper}>
      <ParticipantListButtons selectedMode={selectedMode} setMode={setMode} />
      <ActiveCall mode={selectedMode} />
      {reactionModal && <ReactionModal setReactionModal={setReactionModal} />}
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
