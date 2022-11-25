import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  Switch,
  Button,
  ActivityIndicator,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { RootStackParamList } from '../../../types';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { joinCall } from '../../utils/callUtils';
import { meetingId } from '../../modules/helpers/meetingId';

import { prontoCallId$ } from '../../hooks/useProntoLinkEffect';
import { useStreamVideoStoreValue } from '@stream-io/video-react-native-sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

const Meeting = ({ navigation }: Props) => {
  const meetingCallID = useAppGlobalStoreValue((store) => store.meetingCallID);
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );
  const videoClient = useStreamVideoStoreValue((store) => store.videoClient);
  const localMediaStream = useStreamVideoStoreValue(
    (store) => store.localMediaStream,
  );
  const [loading, setLoading] = useState(false);
  const setState = useAppGlobalStoreSetState();

  const createOrJoinCallHandler = async () => {
    if (videoClient && localMediaStream) {
      setLoading(true);
      try {
        const response = await joinCall(videoClient, localMediaStream, {
          autoJoin: true,
          callId: meetingCallID,
          callType: 'default',
        });
        if (!response) {
          throw new Error('Call is not defined');
        }
        setLoading(false);
        navigation.navigate('ActiveCall');
      } catch (err) {
        console.log(err);
      }
    }
  };

  useEffect(() => {
    if (localMediaStream) {
      const subscription = prontoCallId$.subscribe((prontoCallId) => {
        if (prontoCallId) {
          setState({
            meetingCallID: prontoCallId,
          });
          prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
          if (videoClient) {
            joinCall(videoClient, localMediaStream, {
              callId: prontoCallId,
              callType: 'default',
              autoJoin: true,
            });
          }
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [localMediaStream, setState, videoClient]);

  const handleCopyInviteLink = useCallback(
    () =>
      Clipboard.setString(
        `https://stream-calls-dogfood.vercel.app/join/${meetingCallID}/`,
      ),
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
            const callID = meetingId();
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
