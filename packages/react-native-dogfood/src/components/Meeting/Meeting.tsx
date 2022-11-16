import React, { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  Switch,
  Button,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useCall } from '../../hooks/useCall';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { mediaDevices } from 'react-native-webrtc';
import { meetingId } from '../../modules/helpers/meetingId';
import { prontoCallId$ } from '../../hooks/useProntoLinkEffect';

const Meeting = () => {
  const callID = useAppGlobalStoreValue((store) => store.callID);
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const setState = useAppGlobalStoreSetState();

  // run only once per app lifecycle
  useEffect(() => {
    const configure = async () => {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setState({
        localMediaStream: mediaStream,
      });
    };
    configure();
  }, [setState]);

  const { getOrCreateCall, joinCall } = useCall({
    callId: callID,
    callType: 'default', // TODO: SANTHOSH -- what is this?
    autoJoin: true,
  });

  useEffect(() => {
    if (localMediaStream) {
      const subscription = prontoCallId$.subscribe((prontoCallId) => {
        if (prontoCallId) {
          setState({
            callID: prontoCallId,
          });
          prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
          joinCall(prontoCallId, 'default', localMediaStream);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [joinCall, localMediaStream, setState]);

  const handleCopyInviteLink = useCallback(
    () =>
      Clipboard.setString(
        `https://stream-calls-dogfood.vercel.app/join/${callID}/`,
      ),
    [callID],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{'Whats the call ID?'}</Text>
        <Button
          title={'Randomise'}
          color="blue"
          onPress={() => {
            setState({ callID: meetingId() });
          }}
        />
      </View>
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
