import React from 'react';
import {IncomingCallView} from '@stream-io/video-react-native-sdk';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';
import {useAppContext} from '../context/AppContext';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'IncomingCallScreen'
>;

const IncomingCallScreen = ({navigation}: Props) => {
  const {channel} = useAppContext();
  const onAnswerCall = () => {
    navigation.navigate('ActiveCallScreen');
  };

  const onRejectCall = () => {
    if (!channel) {
      navigation.navigate('ChannelListScreen');
    } else {
      navigation.navigate('ChannelScreen');
    }
  };

  return (
    <IncomingCallView onAnswerCall={onAnswerCall} onRejectCall={onRejectCall} />
  );
};

export default IncomingCallScreen;
