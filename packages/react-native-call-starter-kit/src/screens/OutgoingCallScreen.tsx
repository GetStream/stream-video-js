import React, {useCallback} from 'react';
import {OutgoingCallView} from '@stream-io/video-react-native-sdk';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';
import {useAppContext} from '../context/AppContext';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'OutgoingCallScreen'
>;

function OutgoingCallScreen({navigation}: Props) {
  const {channel} = useAppContext();

  const onHangupCall = useCallback(() => {
    if (!channel) {
      navigation.navigate('ChannelListScreen');
    } else {
      navigation.navigate('ChannelScreen');
    }
  }, [channel, navigation]);

  return <OutgoingCallView onHangupCall={onHangupCall} />;
}

export default OutgoingCallScreen;
