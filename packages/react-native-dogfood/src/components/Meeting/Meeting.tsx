import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  Switch,
  Button,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { RootStackParamList } from '../../../types';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { mediaDevices } from 'react-native-webrtc';
import { getOrCreateCall } from '../../utils/callUtils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';

const APP_ID = 'streamrnvideosample';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

const Meeting = ({ navigation }: Props) => {
  const meetingCallID = useAppGlobalStoreValue((store) => store.meetingCallID);
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const [loading, setLoading] = useState(false);
  const setState = useAppGlobalStoreSetState();

  // run only once per app lifecycle
  useEffect(() => {
    const parseAndSetCallID = (url: string | null) => {
      const matchResponse = url?.match(/.*callID\/(.*)\//);
      if (!matchResponse || matchResponse.length < 1) {
        return null;
      }

      setState({
        meetingCallID: matchResponse[1],
      });
    };
    // listen to url changes and parse the callID
    const { remove } = Linking.addEventListener('url', ({ url }) => {
      parseAndSetCallID(url);
    });
    const configure = async () => {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setState({
        localMediaStream: mediaStream,
      });
      const url = await Linking.getInitialURL();
      parseAndSetCallID(url);
    };

    configure();
    return remove;
  }, [setState]);

  const createOrJoinCallHandler = async () => {
    setLoading(true);
    if (videoClient && localMediaStream) {
      try {
        const response = await getOrCreateCall(videoClient, localMediaStream, {
          autoJoin: true,
          callId: meetingCallID,
          callType: 'default',
        });
        if (response) {
          const { activeCall, call: callResponse } = response;
          if (!callResponse || !activeCall) {
            setLoading(false);
            return;
          }
          setState({
            activeCall: response?.activeCall,
            call: callResponse,
            ringing: false,
          });
          setLoading(false);
          navigation.navigate('ActiveCall');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleCopyInviteLink = useCallback(
    () => Clipboard.setString(`${APP_ID}://callID/${meetingCallID}/`),
    [meetingCallID],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{'Whats the call ID?'}</Text>
        <Button
          title={'Randomise'}
          color="blue"
          onPress={() => {
            const callID = uuidv4().toLowerCase();
            setState({ meetingCallID: callID });
          }}
        />
      </View>
      <TextInput
        style={styles.textInput}
        placeholder={'Type your call ID here...'}
        placeholderTextColor={'#8C8C8CFF'}
        value={meetingCallID}
        onChangeText={(text) => setState({ meetingCallID: text.trim() })}
      />
      <Button
        title={'Create or Join call with callID: ' + meetingCallID}
        color="blue"
        disabled={!meetingCallID}
        onPress={createOrJoinCallHandler}
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
      {loading && <ActivityIndicator />}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
