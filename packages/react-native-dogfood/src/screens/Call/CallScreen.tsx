import React from 'react';
import { ActiveCall, useActiveCall } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RingingStackParamList } from '../../../types';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '@stream-io/video-react-native-sdk/dist/src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RingingStackParamList, 'CallScreen'>;

export const CallScreen = ({ navigation }: Props) => {
  const activeCall = useActiveCall();

  const onOpenCallParticipantsInfoViewHandler = () => {
    navigation.navigate('CallParticipantsInfoScreen');
  };

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
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
