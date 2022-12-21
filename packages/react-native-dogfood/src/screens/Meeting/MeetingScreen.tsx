import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActiveCall } from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = ({ navigation }: Props) => {
  const onHangupCallHandler = () => {
    navigation.navigate('JoinMeetingScreen');
  };

  const onOpenCallParticipantsInfoViewHandler = () => {
    navigation.navigate('CallParticipantsInfoScreen');
  };

  return (
    <ActiveCall
      onHangupCall={onHangupCallHandler}
      onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoViewHandler}
    />
  );
};
