import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActiveCall } from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = ({ navigation }: Props) => {
  return (
    <ActiveCall
      onHangupCall={() => navigation.navigate('JoinMeetingScreen')}
      onOpenParticipantsView={() =>
        navigation.navigate('CallParticipantsInfoScreen')
      }
    />
  );
};
