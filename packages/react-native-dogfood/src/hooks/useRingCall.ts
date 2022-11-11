import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import InCallManager from 'react-native-incall-manager';
import { StreamSfuClient } from '@stream-io/video-client';
import { useSessionId } from '../hooks/useSessionId';
import { Call } from '../modules/Call';
import { useCallKeep } from '../hooks/useCallKeep';

export const useRingCall = () => {
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const username = useAppGlobalStoreValue((store) => store.username);
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'IncomingCallScreen'>
    >();
  const setState = useAppGlobalStoreSetState();
  const { startCall } = useCallKeep();

  const route = useRoute<RouteProp<RootStackParamList, 'IncomingCallScreen'>>();
  const {
    params: { callCid, id },
  } = route;

  const sessionId = useSessionId(id, username);

  const answerCall = async () => {
    if (videoClient) {
      await videoClient.answerCall(callCid);
      const result = await videoClient.joinCallRaw({
        id,
        type: 'default',
        datacenterId: 'amsterdam',
      });
      if (result) {
        const { response, edge } = result;
        if (response) {
          const { call: activeCall } = response;
          const credentials = edge.credentials;

          if (!credentials || !activeCall) {
            return;
          }

          setState({ activeCall: activeCall.call });
          const serverUrl = 'http://192.168.1.34:3031/twirp';

          const sfuClient = new StreamSfuClient(
            serverUrl,
            credentials.token,
            sessionId,
          );
          const call = new Call(sfuClient, username, serverUrl, credentials);
          try {
            const callState = await call.join(localMediaStream);
            if (callState && localMediaStream) {
              InCallManager.start({ media: 'video' });
              InCallManager.setForceSpeakerphoneOn(true);
              await call.publish(localMediaStream);
              setState({
                activeCall: activeCall.call,
                callState,
                sfuClient,
                call,
              });
              startCall({
                callID: id,
                createdByUserId: username,
              });
              navigation.navigate('ActiveCall');
            }
          } catch (err) {
            setState({
              callState: undefined,
            });
          }
        }
      }
    }
  };

  const rejectCall = async () => {
    if (videoClient) {
      await videoClient.rejectCall(callCid);
      await navigation.navigate('HomeScreen');
    }
  };

  return { answerCall, rejectCall };
};
