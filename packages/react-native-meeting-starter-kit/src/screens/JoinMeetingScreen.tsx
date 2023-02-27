import React, {useCallback, useState} from 'react';
import {
  StyleSheet,
  TextInput,
  SafeAreaView,
  View,
  Text,
  Button,
} from 'react-native';

import {meetingId} from '../utils/meetingId';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';

type JoinMeetingScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'JoinMeetingScreen'
>;

export const JoinMeetingScreen = (props: JoinMeetingScreenProps) => {
  const [callID, setCallId] = useState('');
  const {navigation} = props;

  const joinCallHandler = useCallback(() => {
    navigation.navigate('CallLobbyScreen', {callId: callID});
  }, [navigation, callID]);

  return (
    <SafeAreaView style={styles.container}>
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
        onChangeText={text => setCallId(text.trim().split(' ').join('-'))}
      />
      <Button
        title={'Create meeting with callID: ' + callID}
        color="blue"
        disabled={!callID}
        onPress={joinCallHandler}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
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
