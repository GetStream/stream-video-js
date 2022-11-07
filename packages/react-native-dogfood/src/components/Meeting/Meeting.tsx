import React, { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  Switch,
  Button,
  Linking,
} from 'react-native';
import InCallManager from 'react-native-incall-manager';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Clipboard from '@react-native-clipboard/clipboard';
import { RootStackParamList } from '../../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserInput } from '@stream-io/video-client';
import { useCreateStreamVideoClient } from '../../hooks/useCreateStreamVideoClient';
import { useCall } from '../../hooks/useCall';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { mediaDevices } from 'react-native-webrtc';

// export const SFU_HOSTNAME = "192.168.2.24";
// const SFU_URL = `http://${SFU_HOSTNAME}:3031/twirp`;
// export const SFU_HOSTNAME = 'sfu2.fra1.gtstrm.com';
// const SFU_URL = 'https://sfu2.fra1.gtstrm.com/rpc/twirp';
// const DEFAULT_USER_NAME = 'steve';
// const DEFAULT_CALL_ID = '123';
const APP_ID = 'streamrnvideosample';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

const Meeting = ({ navigation }: Props) => {
  const callID = useAppGlobalStoreValue((store) => store.callID);
  const username = useAppGlobalStoreValue((store) => store.username);
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const setState = useAppGlobalStoreSetState();

  // run only once per app lifecycle
  useEffect(() => {
    const parseAndSetCallID = (url: string | null) => {
      const matchResponse = url?.match(/.*callID\/(.*)\//);
      if (!matchResponse || matchResponse.length < 1) {
        return null;
      }

      setState({
        callID: matchResponse[1],
      });
    };
    const configure = async () => {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setState({
        localMediaStream: mediaStream,
      });

      // listen to url changes and parse the callID
      Linking.addEventListener('url', ({ url }) => {
        parseAndSetCallID(url);
      });
      const url = await Linking.getInitialURL();
      parseAndSetCallID(url);
    };

    configure();
  }, [setState]);

  const user = useMemo<UserInput>(
    () => ({
      name: username,
      role: 'admin',
      teams: ['team-1, team-2'],
      imageUrl: `https://getstream.io/random_png/?id=${username}&name=${username}`,
      customJson: new Uint8Array(),
    }),
    [username],
  );

  useCreateStreamVideoClient({
    // coordinatorRpcUrl: 'http://localhost:26991',
    // coordinatorWsUrl: 'ws://localhost:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
    coordinatorRpcUrl:
      'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
    coordinatorWsUrl:
      'ws://wss-video-coordinator.oregon-v1.stream-io-video.com:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
    apiKey: 'key10', // see <video>/data/fixtures/apps.yaml for API key/secret
    apiSecret: 'secret10',
    user,
  });

  const { activeCall, activeCallMeta, getOrCreateCall } = useCall({
    callId: callID,
    callType: 'default', // TODO: SANTHOSH -- what is this?
    autoJoin: true,
  });

  useEffect(() => {
    const joinSfuCall = async () => {
      try {
        if (activeCall && localMediaStream) {
          InCallManager.start({ media: 'video' });
          InCallManager.setForceSpeakerphoneOn(true);
          // @ts-ignore
          await activeCall.publishCombinedStream(localMediaStream);
          setState({
            activeCall: activeCallMeta,
            call: activeCall,
          });
          navigation.navigate('ActiveCall');
        }
      } catch (err) {
        console.warn('failed to join call', err);
        setState({
          callState: undefined,
        });
      }
    };
    joinSfuCall();
  }, [
    activeCall,
    activeCallMeta,
    localMediaStream,
    navigation,
    setState,
    username,
  ]);

  const handleCopyInviteLink = useCallback(
    () => Clipboard.setString(`${APP_ID}://callID/${callID}/`),
    [callID],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>{'Whats the call ID?'}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={'Type your call ID here...'}
        placeholderTextColor={'#8C8C8CFF'}
        value={callID}
        onChangeText={(text) => setState({ callID: text.trim() })}
      />
      <Button
        title={'Create or Join call with callID: ' + callID}
        color="blue"
        disabled={!callID}
        onPress={getOrCreateCall}
      />
      <View style={styles.switchContainer}>
        <Text style={styles.loopbackText}>Loopback my video(Debug Mode)</Text>
        <Switch
          value={loopbackMyVideo}
          onChange={() => {
            setState((prevState) => ({
              loopbackMyVideo: !prevState.loopbackMyVideo,
            }));
          }}
        />
      </View>
      <Button
        title="Copy Invite Link"
        color="blue"
        onPress={handleCopyInviteLink}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  textInput: {
    color: '#000',
    height: 40,
    width: '100%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    paddingLeft: 10,
    marginVertical: 8,
  },
  switchContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  headerText: {
    color: 'black',
    fontSize: 20,
    marginVertical: 8,
  },
  loopbackText: {
    color: 'black',
  },
});

export default Meeting;
