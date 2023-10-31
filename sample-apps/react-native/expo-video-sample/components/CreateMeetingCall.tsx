import React, { useState } from 'react';
import {
  Button,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { randomId } from '../utils/randomId';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import { users } from '../data/users';
import { router } from 'expo-router';

export default function CreateMeeting() {
  const [callId, setCallId] = useState<string>('');
  const videoClient = useStreamVideoClient();
  const [shouldNotify, setShouldNotify] = useState(true);
  const toggleSwitch = () => setShouldNotify((previousState) => !previousState);

  const joinCallHandler = async () => {
    const call = videoClient!.call('default', callId as string);
    if (shouldNotify) {
      const members = users.map((u) => ({
        user_id: u.id,
      }));
      await call?.getOrCreate({
        notify: true,
        data: {
          members,
        },
      });
    } else {
      await call?.getOrCreate();
    }
    router.push('/meeting');
  };

  return (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{"Meeting - What's the call ID?"}</Text>
        <Button
          title={'Randomise'}
          color="blue"
          onPress={() => {
            const randomCallID = randomId();
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
        onChangeText={(text) => setCallId(text.trim().split(' ').join('-'))}
      />
      <Button
        title={'Create meeting with callID: ' + callId}
        color="blue"
        disabled={!callId}
        onPress={joinCallHandler}
      />
      <View style={styles.switchContainer}>
        <Text style={styles.headerText}>{'Notify Members?'}</Text>
        <Switch onValueChange={toggleSwitch} value={shouldNotify} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  textInput: {
    color: '#000',
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    paddingLeft: 10,
    marginVertical: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: 'black',
    flex: 1,
    fontSize: 20,
    marginRight: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
  switchText: {
    color: 'black',
    flex: 1,
    fontSize: 12,
    marginRight: 8,
  },
});
