import React, { useMemo, useEffect } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import {
  useStreamVideoClient,
  Call,
  StreamCall,
} from '@stream-io/video-react-native-sdk';
import { MeetingUI } from '../../components/MeetingUI';

export default function MeetingScreen() {
  const client = useStreamVideoClient();
  const { id: callId } = useLocalSearchParams();
  const callType = 'default';

  const call = useMemo<Call | undefined>(() => {
    if (!client) {
      return undefined;
    }
    return client.call(callType, callId as string);
  }, [callId, callType, client]);

  useEffect(() => {
    const getOrCreateCall = async () => {
      try {
        await call?.getOrCreate();
      } catch (error) {
        console.error('Failed to get or create call', error);
      }
    };

    getOrCreateCall();
  }, [call]);

  if (!call) {
    return <ActivityIndicator />;
  }

  return (
    <StreamCall
      call={call}
      mediaDeviceInitialState={{
        initialAudioEnabled: false,
        initialVideoEnabled: false,
      }}
    >
      <Stack.Screen options={{ title: 'Meeting Screen', headerShown: false }} />
      <MeetingUI />
    </StreamCall>
  );
}
