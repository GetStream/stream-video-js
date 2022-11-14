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
import { MediaStream } from 'react-native-webrtc';

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
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const setState = useAppGlobalStoreSetState();

  const joinCall = useCallback(
    async (id: string, type: string, mediaStream: MediaStream) => {
      if (!videoClient) {
        throw new Error('VideoClient not initialized');
      }
      const call = await videoClient.joinCall({
        id,
        type,
        // TODO: SANTHOSH, this is optional, check its purpose
        datacenterId: '',
      });
      if (!call) {
        throw new Error(`Failed to join a call with id: ${id}`);
      }
      try {
        InCallManager.start({ media: 'video' });
        InCallManager.setForceSpeakerphoneOn(true);
        await call.join(mediaStream, mediaStream);
        await call.publish(mediaStream, mediaStream);
        setState({
          call,
        });
        navigation.navigate('ActiveCall');
      } catch (err) {
        console.warn('failed to join call', err);
      }
    },
    [navigation, setState, videoClient],
  );

  const getOrCreateCall = useCallback(async () => {
    if (!videoClient) {
      throw new Error('VideoClient not initialized');
    }
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
        await joinCall(callId, callType, localMediaStream);
      }
    }
  }, [
    autoJoin,
    callId,
    callType,
    input,
    joinCall,
    localMediaStream,
    setState,
    videoClient,
  ]);

  return { getOrCreateCall, joinCall };
};
