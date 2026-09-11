import React, { useEffect, useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { MeetingUI } from '../../components/MeetingUI';
import { getE2EESettingsOverride } from '../../utils/e2ee';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;

export const MeetingScreen = (props: Props) => {
  const { route } = props;
  const client = useStreamVideoClient();
  const callType = 'default';
  const {
    params: { callId },
  } = route;
  const call = useMemo<Call | undefined>(() => {
    if (!client) {
      return undefined;
    }
    return client.call(callType, callId);
  }, [callId, callType, client]);
  // @ts-expect-error - Expose call to globalThis for debugging purposes
  globalThis.call = call;

  useEffect(() => {
    const getOrCreateCall = async () => {
      try {
        // A call's encryption setting is fixed at creation, and the backend
        // rejects an E2EE join against a call that was not created for it.
        const settings_override = getE2EESettingsOverride();
        await call?.getOrCreate(
          settings_override ? { data: { settings_override } } : undefined,
        );
      } catch (error) {
        console.error('Failed to get or create call', error);
      }
    };

    getOrCreateCall();
  }, [call]);

  if (!call) {
    return null;
  }

  return (
    <StreamCall call={call}>
      <MeetingUI callId={callId} {...props} />
    </StreamCall>
  );
};
