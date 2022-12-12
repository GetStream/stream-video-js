import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActiveCall,
  StreamMeeting,
  useActiveCall,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { ActivityIndicator, StyleSheet } from 'react-native';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = ({ navigation }: Props) => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const meetingCallID = useAppGlobalStoreValue((store) => store.meetingCallID);
  const activeCall = useActiveCall();

  return (
    <StreamMeeting
      currentUser={username}
      callId={meetingCallID}
      callType={'default'}
      autoJoin={true}
    >
      {activeCall ? (
        <ActiveCall
          onHangupCall={() => navigation.navigate('JoinMeetingScreen')}
        />
      ) : (
        <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
      )}
    </StreamMeeting>
  );
};
