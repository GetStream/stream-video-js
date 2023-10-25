import {
  Call,
  StreamCall,
  HostLivestream,
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import React, { useEffect, useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HostLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'HostLiveStream'
>;

export const HostLiveStreamScreen = ({ route }: HostLiveStreamScreenProps) => {
  const client = useStreamVideoClient();
  const connectedUser = useConnectedUser();
  const callType = 'livestream';
  const {
    params: { callId },
  } = route;

  const call = useMemo<Call | undefined>(() => {
    if (!client) {
      return undefined;
    }
    return client.call(callType, callId);
  }, [callId, callType, client]);

  useEffect(() => {
    const getOrCreateCall = async () => {
      try {
        if (!(call && connectedUser)) {
          return;
        }
        await call?.join({
          create: true,
          data: {
            members: [{ user_id: connectedUser.id, role: 'host' }],
          },
        });
        await call?.getOrCreate();
      } catch (error) {
        console.error('Failed to get or create call', error);
      }
    };

    getOrCreateCall();
  }, [call, connectedUser]);

  if (!connectedUser || !call) {
    return <Text>Loading...</Text>;
  }

  return (
    <StreamCall call={call}>
      <SafeAreaView style={styles.container}>
        <HostLivestream hls={true} />
      </SafeAreaView>
    </StreamCall>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
