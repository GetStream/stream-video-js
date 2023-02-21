import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  Switch,
  Button,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { meetingId } from '../../modules/helpers/meetingId';

import { prontoCallId$ } from '../../hooks/useProntoLinkEffect';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../../types';

type JoinMeetingScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'JoinMeetingScreen'
>;

const JoinMeetingScreen = (props: JoinMeetingScreenProps) => {
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );
  const [callID, setCallId] = useState('');
  const { navigation } = props;

  const setState = useAppGlobalStoreSetState();

  const joinCallHandler = useCallback(() => {
    navigation.navigate('LobbyViewScreen', { callID: callID });
  }, [navigation, callID]);

  useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setCallId(prontoCallId);
        prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
        joinCallHandler();
      }
    });
    return () => subscription.unsubscribe();
  }, [joinCallHandler]);

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
            const ramdomCallID = meetingId();
            setCallId(ramdomCallID);
          }}
        />
      </View>
      <TextInput
        style={styles.textInput}
        placeholder={'Type your call ID here...'}
        placeholderTextColor={'#8C8C8CFF'}
        value={callID}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(text) => setCallId(text.trim().split(' ').join('-'))}
      />
      <Button
        title={'Create or Join call with callID: ' + callID}
        color="blue"
        disabled={!callID}
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
