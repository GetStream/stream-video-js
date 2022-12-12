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
import { MeetingStackParamList } from '../../../types';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { meetingId } from '../../modules/helpers/meetingId';

import { prontoCallId$ } from '../../hooks/useProntoLinkEffect';

type Props = NativeStackScreenProps<MeetingStackParamList, 'JoinMeetingScreen'>;

const JoinMeetingScreen = ({ navigation }: Props) => {
  const meetingCallID = useAppGlobalStoreValue((store) => store.meetingCallID);
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );

  const setState = useAppGlobalStoreSetState();

  const joinCallHandler = useCallback(() => {
    navigation.navigate('MeetingScreen');
  }, [navigation]);

  useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({
          meetingCallID: prontoCallId,
        });
        prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
        joinCallHandler();
      }
    });
    return () => subscription.unsubscribe();
  }, [joinCallHandler, setState]);

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
        onPress={joinCallHandler}
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

export default JoinMeetingScreen;
