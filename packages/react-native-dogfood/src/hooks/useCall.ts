import { useCallback } from 'react';
import { CreateCallInput } from '@stream-io/video-client';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import InCallManager from 'react-native-incall-manager';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

export type UseCallParams = {
  callId: string;
  callType: string;
  autoJoin: boolean;
  input?: CreateCallInput;
};

export const useCall = ({
  callId,
  callType,
  autoJoin,
  input,
}: UseCallParams) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  if (!videoClient) {
    throw new Error('VideoClient not initialized');
  }
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const setState = useAppGlobalStoreSetState();

  const joinCall = useCallback(
    async (id: string, type: string) => {
      const call = await videoClient.joinCall({
        id,
        type,
        // FIXME: OL this needs to come from somewhere
        datacenterId: 'amsterdam',
      });
      if (!call) {
        throw new Error(`Failed to join a call with id: ${callId}`);
      }
      try {
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
        await call.joinWithCombinedStream(localMediaStream);
        // @ts-ignore
        await call.publishCombinedStream(localMediaStream);
        setState({
          call: call,
        });
        navigation.navigate('ActiveCall');
      } catch (err) {
        console.warn('failed to join call', err);
      }
    },
    [callId, localMediaStream, navigation, setState, videoClient],
  );

  const getOrCreateCall = useCallback(async () => {
    const callMetadata = await videoClient.getOrCreateCall({
      id: callId,
      type: callType,
      input,
    });
    if (callMetadata) {
      setState({
        activeCall: callMetadata.call,
      });

      if (autoJoin) {
        await joinCall(callId, callType);
      }
    }
  }, [autoJoin, callId, callType, input, joinCall, setState, videoClient]);

  return { getOrCreateCall };
};
