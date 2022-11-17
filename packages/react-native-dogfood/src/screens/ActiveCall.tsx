import React from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import CallControls from '../components/CallControls';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types';
import CallParticipantsView from '../containers/CallParticipantsView';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveCall'>;

export default (_props: Props) => {
  return (
    <SafeAreaView style={styles.body} edges={['right', 'left']}>
      <CallParticipantsView />
      <CallControls />
      {/* <Stats /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.white,
    flex: 1,
  },
  stream: {
    backgroundColor: Colors.black,
    flex: 1,
  },
  header: {
    backgroundColor: '#1486b5',
  },
  container: {
    justifyContent: 'center',
    backgroundColor: 'black',
    flexDirection: 'row',
    alignItems: 'center',
    display: 'flex',
    flex: 1,
  },
  icons: {
    display: 'flex',
    flexDirection: 'row',
    position: 'absolute',
    right: 20,
    top: 50,
    zIndex: 1,
  },
});
