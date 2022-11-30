import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { TabBar } from '../components/TabBar';
import Meeting from '../components/Meeting/Meeting';
import Ringing from '../components/Ringing/Ringing';
import { useCallKeep } from '../hooks/useCallKeep';
import { RootStackParamList } from '../../types';
import { mediaDevices } from 'react-native-webrtc';
import {
  useIncomingRingCalls,
  useTerminatedRingCall,
  useStreamVideoStoreSetState,
} from '@stream-io/video-react-native-sdk';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

export const HomeScreen = ({ navigation, route }: Props) => {
  const [selectedTab, setSelectedTab] = useState('Meeting');
  const [loadingCall, setLoadingCall] = useState(false);

  const incomingRingCalls = useIncomingRingCalls();
  const terminatedRingCallMeta = useTerminatedRingCall();
  const setState = useStreamVideoStoreSetState();

  const { endCall } = useCallKeep();

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
    if (incomingRingCalls.length > 0) {
      navigation.navigate('IncomingCallScreen');
    } else {
      if (terminatedRingCallMeta) {
        endCall();
      }
    }
  }, [incomingRingCalls, navigation, terminatedRingCallMeta, endCall]);

  return (
    <View style={styles.container}>
      {loadingCall ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={'large'} />
          <Text style={styles.loadingText}>Calling...</Text>
        </View>
      ) : (
        <>
          <TabBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          {selectedTab === 'Meeting' ? (
            <Meeting
              navigation={navigation}
              route={route}
              setLoadingCall={setLoadingCall}
            />
          ) : (
            <Ringing
              navigation={navigation}
              route={route}
              setLoadingCall={setLoadingCall}
            />
          )}
        </>
      )}
    </View>
  );
};
