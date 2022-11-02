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
import { Call } from '../../modules/Call';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StreamSfuClient } from '@stream-io/video-client';
import { useCall } from '../../hooks/useCall';
import { useSessionId } from '../../hooks/useSessionId';
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

type Props = NativeStackScreenProps<RootStackParamList, 'MeetingHome'>;

const MeetingHomeScreen = ({ navigation }: Props) => {
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

  const { activeCall, credentials, getOrCreateCall } = useCall({
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
        const callState = await call.join(localMediaStream);
        if (callState && localMediaStream) {
          InCallManager.start({ media: 'video' });
          InCallManager.setForceSpeakerphoneOn(true);
          await call.publish(localMediaStream);
          setState({
            activeCall,
            callState,
            sfuClient,
            call,
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
    credentials,
    localMediaStream,
    navigation,
    sessionId,
    setState,
  ]);

  const handleCopyInviteLink = useCallback(
    () => Clipboard.setString(`${APP_ID}://callID/${callID}/`),
    [callID],
  );

  return (
    <SafeAreaView style={styles.container}>
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

export default MeetingHomeScreen;
