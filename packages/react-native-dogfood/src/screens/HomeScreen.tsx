import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TabBar } from '../components/TabBar';
import Meeting from '../components/Meeting/Meeting';
import Ringing from '../components/Ringing/Ringing';
import { useCallKeep } from '../hooks/useCallKeep';
import { RootStackParamList } from '../../types';
import { mediaDevices } from 'react-native-webrtc';
import {
  useActiveRingCall,
  useIncomingRingCalls,
  useTerminatedRingCall,
  useStreamVideoStoreSetState,
} from '@stream-io/video-react-native-sdk';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

export const HomeScreen = ({ navigation, route }: Props) => {
  const [selectedTab, setSelectedTab] = useState('Meeting');

  const activeRingCallMeta = useActiveRingCall();
  const incomingRingCalls = useIncomingRingCalls();
  const terminatedRingCallMeta = useTerminatedRingCall();
  const setState = useStreamVideoStoreSetState();

  const { displayIncomingCallNow, startCall, endCall } = useCallKeep();

  // run only once per app lifecycle
  useEffect(() => {
    const configure = async () => {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setState({
        localMediaStream: mediaStream,
      });
    };
    configure();
  }, [setState]);

  useEffect(() => {
    if (activeRingCallMeta) {
      startCall();
    } else {
      if (incomingRingCalls.length > 0) {
        displayIncomingCallNow();
      } else {
        if (terminatedRingCallMeta) {
          endCall();
        }
      }
    }
  }, [
    activeRingCallMeta,
    incomingRingCalls,
    displayIncomingCallNow,
    terminatedRingCallMeta,
    startCall,
    endCall,
  ]);

  return (
    <View style={styles.container}>
      <TabBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      {selectedTab === 'Meeting' ? (
        <Meeting navigation={navigation} route={route} />
      ) : (
        <Ringing navigation={navigation} route={route} />
      )}
    </View>
  );
};
