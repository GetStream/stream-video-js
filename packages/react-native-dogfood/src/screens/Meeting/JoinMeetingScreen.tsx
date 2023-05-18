import React, { useCallback, useState } from 'react';
import {
  Button,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { meetingId } from '../../modules/helpers/meetingId';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../../types';

type JoinMeetingScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'JoinMeetingScreen'
>;

const JoinMeetingScreen = (props: JoinMeetingScreenProps) => {
  const [callId, setCallId] = useState<string>('');
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );
  const { navigation } = props;
  const appStoreSetState = useAppGlobalStoreSetState();

  const joinCallHandler = useCallback(() => {
    navigation.navigate('MeetingScreen', { callId });
  }, [navigation, callId]);

  const handleCopyInviteLink = useCallback(
    () =>
      Clipboard.setString(
        `https://stream-calls-dogfood.vercel.app/join/${callId}/`,
      ),
    [callId],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{'Whats the call ID?'}</Text>
        <Button
          title={'Randomise'}
          color="blue"
          onPress={() => {
            const randomCallID = meetingId();
            setCallId(randomCallID);
          }}
        />
      </View>
      <TextInput
        style={styles.textInput}
        placeholder={'Type your call ID here...'}
        placeholderTextColor={'#8C8C8CFF'}
        value={callId}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(text) => {
          setCallId(text.trim().split(' ').join('-'));
        }}
      />
      <Button
        title={'Create or Join call with callID: ' + callId}
        color="blue"
        disabled={!callId}
        onPress={joinCallHandler}
      />
      <View style={styles.switchContainer}>
        <Text style={styles.loopbackText}>Loopback my video(Debug Mode)</Text>
        <Switch
          value={loopbackMyVideo}
          onChange={() => {
            appStoreSetState((prevState) => ({
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
