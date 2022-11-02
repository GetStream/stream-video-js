import React, { useEffect, useState } from 'react';
import {
  Button,
  PermissionsAndroid,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { v4 as uuidv4 } from 'uuid';
import {
  useAppGlobalStoreValue,
  useAppGlobalStoreSetState,
} from '../../contexts/AppContext';

const styles = StyleSheet.create({
  container: {
    margin: 15,
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
  participantsContainer: {
    marginVertical: 20,
  },
  text: {
    color: 'black',
  },
  label: {
    fontSize: 20,
  },
  participant: {
    paddingVertical: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
  },
  selectedParticipant: {
    color: 'red',
    fontWeight: 'bold',
  },
});

const Ringing = () => {
  const [logText, setLog] = useState('');
  const [heldCalls, setHeldCalls] = useState({}); // callKeep uuid: held
  const [calls, setCalls] = useState({}); // callKeep uuid: number
  const callID = useAppGlobalStoreValue((store) => store.callID);
  const username = useAppGlobalStoreValue((store) => store.username);
  const [currCallId, setCurrCallId] = useState('');

  const users = [
    { id: 'steve', name: 'Steve Galilli' },
    { id: 'khushal', name: 'Khushal Agarwal' },
    { id: 'santhosh', name: 'Santhosh Vaiyapuri' },
  ];

  const setState = useAppGlobalStoreSetState();

  const getRandomNumber = () => String(Math.floor(Math.random() * 100000));
  const getNewUuid = () => uuidv4().toLowerCase();
  const format = (uuid: string) => uuid.split('-')[0];

  const log = (text: string) => {
    setLog(logText + '\n' + text);
  };

  const addCall = (callUUID: string, number: string) => {
    setHeldCalls({ ...heldCalls, [callUUID]: false });
    setCalls({ ...calls, [callUUID]: number });
  };

  const callUUID = getNewUuid();

  const displayIncomingCall = (number: string) => {
    addCall(callUUID, number);
    setCurrCallId(callUUID);

    log(`[displayIncomingCall] ${format(callUUID)}, number: ${number}`);

    try {
      RNCallKeep.displayIncomingCall(
        callUUID,
        '2738282929',
        'Test User',
        'number',
        true,
      );
    } catch (error) {
      console.log(error);
    }
  };

  const startCall = (number: string) => {
    addCall(callUUID, number);
    setCurrCallId(callUUID);
    log(`[startCall] ${format(callUUID)}, number: ${number}`);
    try {
      RNCallKeep.startCall(callUUID, '282829292', 'Test user', 'generic');
    } catch (err) {
      console.log(err);
    }
  };

  const removeCall = () => {
    const { ...updated } = calls;
    const { ...updatedHeldCalls } = heldCalls;

    setCalls(updated);
    setCalls(updatedHeldCalls);
  };

  const hangup = () => {
    RNCallKeep.endCall(currCallId);
    removeCall();
  };

  const displayIncomingCallNow = () => {
    displayIncomingCall(getRandomNumber());
  };
  const startCallHandler = () => {
    startCall(getRandomNumber());
  };

  useEffect(() => {
    const options = {
      ios: {
        appName: 'StreamReactNativeVideoSDKSample',
      },
      android: {
        alertTitle: 'Permissions required',
        alertDescription:
          'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'ok',
        imageName: 'phone_account_icon',
        additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_CONTACTS],
        // Required to get audio in background when using Android 11
        foregroundService: {
          channelId: 'io.getstream.rnvideosample',
          channelName:
            'Foreground service for the app Stream React Native Dogfood',
          notificationTitle: 'App is running on background',
          notificationIcon: 'Path to the resource icon of the notification',
        },
      },
    };

    try {
      RNCallKeep.setup(options).then((accepted) => {
        console.log(accepted);
      });
    } catch (error) {
      console.log(error);
    }
    RNCallKeep.canMakeMultipleCalls(true);
    RNCallKeep.addEventListener('didChangeAudioRoute', ({ output }) => {
      console.log(output);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Ringing Home Screen</Text>
      <TextInput
        style={styles.textInput}
        placeholder={'Type your call ID here...'}
        placeholderTextColor={'#8C8C8CFF'}
        value={callID}
        onChangeText={(text) => setState({ callID: text.trim() })}
      />
      <View style={styles.participantsContainer}>
        <Text style={[styles.text, styles.label]}>Select Participants</Text>
        {users.map((user) => {
          return (
            <Pressable
              style={styles.participant}
              key={user.id}
              onPress={() => {
                setState({ username: user.id });
              }}
            >
              <Text
                style={[
                  styles.text,
                  username === user.id ? styles.selectedParticipant : null,
                ]}
              >
                {user.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button title="Display Incoming Call" onPress={displayIncomingCallNow} />
      <Button title="Start a Call" onPress={startCallHandler} />
      <Button title="Leave Call" onPress={hangup} />
      <ScrollView>
        <Text style={styles.text}>{logText}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Ringing;
