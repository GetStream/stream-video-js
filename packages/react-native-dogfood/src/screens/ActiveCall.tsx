import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CallControls from '../components/CallControls';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types';
import { CallParticipantsView } from '@stream-io/video-react-native-sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveCall'>;

export default (_props: Props) => {
  return (
    <SafeAreaView style={styles.body}>
      <View style={styles.callParticipantsWrapper}>
        <CallParticipantsView />
      </View>
      <CallControls />
      {/* <Stats /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  callParticipantsWrapper: { flex: 1, marginBottom: -20 },
});
