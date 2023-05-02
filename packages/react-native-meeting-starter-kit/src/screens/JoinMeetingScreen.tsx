import React, {useCallback} from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {meetingId} from '../utils/meetingId';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from '../types';
import {useAppContext} from '../context/AppContext';

type JoinMeetingScreenProps = NativeStackScreenProps<
  NavigationStackParamsList,
  'JoinMeetingScreen'
>;

export const JoinMeetingScreen = (props: JoinMeetingScreenProps) => {
  const {
    setCallParams,
    callParams: {callId},
  } = useAppContext();
  const {navigation} = props;

  const joinCallHandler = useCallback(() => {
    navigation.navigate('CallLobbyScreen');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{'Whats the call ID?'}</Text>
        <Button
          title={'Randomise'}
          color="blue"
          onPress={() => {
            const randomCallID = meetingId();
            setCallParams(prevState => ({...prevState, callId: randomCallID}));
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
        onChangeText={text =>
          setCallParams(prevState => ({
            ...prevState,
            callId: text.trim().split(' ').join('-'),
          }))
        }
      />
      <Button
        title={'Create meeting with callID: ' + callId}
        color="blue"
        disabled={!callId}
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
