import React, { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { meetingId } from '../../modules/helpers/meetingId';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../../types';
import { theme } from '@stream-io/video-react-native-sdk';
import Copy from '../../assets/Copy';

type JoinMeetingScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'JoinMeetingScreen'
>;

const JoinMeetingScreen = (props: JoinMeetingScreenProps) => {
  const [callId, setCallId] = useState<string>('');

  const { navigation } = props;
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const username = useAppGlobalStoreValue((store) => store.username);

  const joinCallHandler = useCallback(() => {
    navigation.navigate('MeetingScreen', { callId });
  }, [navigation, callId]);

  const startNewCallHandler = (call_id: string) => {
    navigation.navigate('MeetingScreen', { callId: call_id });
  };

  const handleCopyInviteLink = useCallback(
    () =>
      Clipboard.setString(
        `https://stream-calls-dogfood.vercel.app/join/${callId}/`,
      ),
    [callId],
  );

  return (
    <View style={styles.container}>
      <Image source={{ uri: userImageUrl }} style={styles.logo} />
      <View>
        <Text style={styles.title}>Hello, {username}</Text>
        <Text style={styles.subTitle}>
          Start or join a meeting by entering the call ID.
        </Text>
      </View>

      <View style={styles.createCall}>
        <TextInput
          style={styles.textInput}
          placeholder={'Type your Call ID'}
          placeholderTextColor={'#8C8C8CFF'}
          value={callId}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => {
            setCallId(text.trim().split(' ').join('-'));
          }}
        />

        <Pressable
          style={[styles.button, !callId ? styles.disabledButtonStyle : null]}
          onPress={joinCallHandler}
          disabled={!callId}
        >
          <Text style={styles.buttonText}>Join Call</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.iconButton]}
          onPress={handleCopyInviteLink}
        >
          <View style={styles.svgContainer}>
            <Copy color={'white'} />
          </View>
        </Pressable>
      </View>
      <Pressable
        style={[styles.button, styles.longButton]}
        onPress={() => {
          const randomCallID = meetingId();
          startNewCallHandler(randomCallID);
        }}
      >
        <Text style={styles.buttonText}>Start a new Call</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.light.static_grey,
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  logo: {
    height: 100,
    width: 100,
    borderRadius: 50,
  },
  title: {
    fontSize: 30,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  subTitle: {
    color: '#979797',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginHorizontal: 50,
  },
  button: {
    backgroundColor: '#005FFF',
    paddingVertical: 12,
    width: 100,
    marginLeft: 10,
    justifyContent: 'center',
    borderRadius: 8,
    alignItems: 'center',
  },
  longButton: {
    width: 320,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 17,
  },
  disabledButtonStyle: {
    backgroundColor: '#4C525C',
  },
  svgContainer: {
    height: 20,
    width: 16,
  },
  iconButton: {
    width: 40,
  },
  textInput: {
    paddingLeft: 15,
    height: 50,
    backgroundColor: '#1C1E22',
    borderRadius: 8,
    borderColor: '#4C525C',
    borderWidth: 1,
    color: 'white',
    width: 170,
    fontSize: 17,
  },
  createCall: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
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
