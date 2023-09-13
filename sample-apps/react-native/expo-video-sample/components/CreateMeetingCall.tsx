import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { randomId } from '../utils/randomId';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';

export default function CreateMeeting() {
  const [callId, setCallId] = useState<string>('');
  const videoClient = useStreamVideoClient();

  const joinCallHandler = async () => {
    const call = videoClient!.call('default', callId as string);
    await call?.getOrCreate();
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
});
