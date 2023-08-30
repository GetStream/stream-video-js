import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { randomId } from '../utils/randomId';
import { NavigationHeader } from '../components/NavigationHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinMeetingScreen() {
  const router = useRouter();
  const [callId, setCallId] = useState<string>('');

  const joinCallHandler = () => {
    router.push(`/call/${callId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Join Meeting Screen',
          header: () => <NavigationHeader />,
        }}
      />
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{"What's the call ID?"}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
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
