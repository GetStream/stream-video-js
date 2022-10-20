import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import CallControls from '../components/CallControls';
import { SafeAreaView } from 'react-native-safe-area-context';
import VideoRenderer from '../containers/VideoRenderer';
import { RootStackParamList } from '../../types';
import {
  useAppSetterContext,
  useAppValueContext,
} from '../contexts/AppContext';
import { Stats } from '../components/Stats';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveCall'>;

export default (_props: Props) => {
  const { call } = useAppValueContext();
  const { setParticipants } = useAppSetterContext();

  useEffect(() => {
    if (!call) {
      return;
    }
    const unsubscribeParticipantJoined = call.on(
      'participantJoined',
      async (e) => {
        if (e.eventPayload.oneofKind !== 'participantJoined') {
          return;
        }

        const { participant } = e.eventPayload.participantJoined;
        if (participant) {
          setParticipants((prevParticipants) => [
            ...prevParticipants,
            participant,
          ]);
        }
      },
    ).unsubscribe;
    const unsubscribeParticipantLeft = call.on('participantLeft', (e) => {
      if (e.eventPayload.oneofKind !== 'participantLeft') {
        return;
      }

      const { participant } = e.eventPayload.participantLeft;
      if (participant) {
        setParticipants((ps) =>
          ps.filter((p) => p.user!.id !== participant.user!.id),
        );
      }
    }).unsubscribe;

    return () => {
      unsubscribeParticipantJoined();
      unsubscribeParticipantLeft();
    };
  }, [call, setParticipants]);

  return (
    <SafeAreaView style={styles.body} edges={['right', 'left']}>
      <VideoRenderer />
      <CallControls />
      <Stats />
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
