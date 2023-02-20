import React, {useCallback} from 'react';
import {IncomingCallView} from '@stream-io/video-react-native-sdk';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';
import {useAppContext} from '../context/AppContext';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'IncomingCallScreen'
>;

function IncomingCallScreen({navigation}: Props) {
  const {channel} = useAppContext();

  const onRejectCall = useCallback(() => {
    if (!channel) {
      navigation.navigate('ChannelListScreen');
    } else {
      navigation.navigate('ChannelScreen');
    }
  }, [navigation, channel]);
  return <IncomingCallView onRejectCall={onRejectCall} />;
}

export default IncomingCallScreen;
