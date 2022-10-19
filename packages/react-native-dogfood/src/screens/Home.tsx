import React, {useCallback, useEffect, useMemo} from 'react';
import {StyleSheet, TextInput, View, Text, Switch, Button} from 'react-native';
import InCallManager from 'react-native-incall-manager';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Clipboard from '@react-native-clipboard/clipboard';
import {RootStackParamList} from '../../types';
import {Call} from '../modules/Call';
import {SafeAreaView} from 'react-native-safe-area-context';
import {UserInput} from '../gen/video/coordinator/user_v1/user';
import {useCreateStreamVideoClient} from '../hooks/useCreateStreamVideoClient';
import {useCall} from '../hooks/useCall';
import {useSessionId} from '../hooks/useSessionId';
import {StreamSfuClient} from '../modules/StreamSfuClient';
import {useAppSetterContext, useAppValueContext} from '../contexts/AppContext';

// export const SFU_HOSTNAME = "192.168.2.24";
// const SFU_URL = `http://${SFU_HOSTNAME}:3031/twirp`;
// export const SFU_HOSTNAME = 'sfu2.fra1.gtstrm.com';
// const SFU_URL = 'https://sfu2.fra1.gtstrm.com/rpc/twirp';
// const DEFAULT_USER_NAME = 'steve';
// const DEFAULT_CALL_ID = '123';
const APP_ID = 'streamrnvideosample';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default ({navigation}: Props) => {
  const {username, callID, loopbackMyVideo, localMediaStream} =
    useAppValueContext();
  const {
    setCall,
    setCallState,
    setSfuClient,
    setUsername,
    setCallID,
    setLoopbackMyVideo,
    setActiveCall,
  } = useAppSetterContext();

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

  const videoClient = useCreateStreamVideoClient({
    // coordinatorRpcUrl: 'http://localhost:26991',
    // coordinatorWsUrl:
    //   'ws://localhost:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
    coordinatorRpcUrl:
      'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
    coordinatorWsUrl:
      'ws://wss-video-coordinator.oregon-v1.stream-io-video.com:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
    apiKey: 'key10', // see <video>/data/fixtures/apps.yaml for API key/secret
    apiSecret: 'secret10',
    user,
  });

  const {activeCall, credentials, getOrCreateCall} = useCall({
    videoClient,
    callId: callID,
    callType: 'default', // TODO: SANTHOSH -- what is this?
    currentUser: username,
    autoJoin: true,
  });

  const sessionId = useSessionId(callID, username);

  useEffect(() => {
    if (!credentials || !activeCall) {
      return;
    }
    const serverUrl = credentials.server?.url || 'http://localhost:3031/twirp';
    const sfuClient = new StreamSfuClient(
      serverUrl,
      credentials.token,
      sessionId,
    );
    const call = new Call(sfuClient, username, serverUrl, credentials);
    const joinSfuCall = async () => {
      try {
        const {callState: _callState} = await call.join(true, localMediaStream);
        if (_callState && localMediaStream) {
          InCallManager.start({media: 'video'});
          InCallManager.setForceSpeakerphoneOn(true);
          await call.publish(localMediaStream);
          setSfuClient(sfuClient);
          setCall(call);
          setCallState(_callState);
          setActiveCall(activeCall);
          navigation.navigate('ActiveCall');
        }
      } catch (err) {
        console.warn('failed to join call', err);
        setCallState(undefined);
      }
    };
    joinSfuCall();
  }, [
    activeCall,
    credentials,
    localMediaStream,
    navigation,
    sessionId,
    setActiveCall,
    setCall,
    setCallState,
    setSfuClient,
    username,
  ]);

  const handleCopyInviteLink = useCallback(
    () => Clipboard.setString(`${APP_ID}://callID/${callID}/`),
    [callID],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>{'Type your username'}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={'Type your name here...'}
        placeholderTextColor={'#8C8C8CFF'}
        value={username}
        onChangeText={text => {
          setUsername(text.trim().replace(/\s/g, '-')); // replace spaces with dashes as spaces are not allowed in usernames
        }}
      />
      <Text style={styles.headerText}>{'Whats the call ID?'}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={'Type your call ID here...'}
        placeholderTextColor={'#8C8C8CFF'}
        value={callID}
        onChangeText={setCallID}
      />
      <Button
        title={'Create or Join call with callID: ' + callID}
        color="blue"
        disabled={!username || !callID}
        onPress={getOrCreateCall}
      />
      <View style={styles.switchContainer}>
        <Text style={styles.loopbackText}>Loopback my video(Debug Mode)</Text>
        <Switch
          value={loopbackMyVideo}
          onChange={() => {
            setLoopbackMyVideo(prevState => !prevState);
          }}
        />
      </View>
      <Button
        title="Copy Invite Link"
        color="blue"
        onPress={handleCopyInviteLink}
      />
    </SafeAreaView>
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
