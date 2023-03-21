import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActiveCall } from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '@stream-io/video-react-native-sdk/dist/src/theme';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = ({ navigation }: Props) => {
  const onOpenCallParticipantsInfoViewHandler = () => {
    navigation.navigate('CallParticipantsInfoScreen');
  };

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
