import React, { useState } from 'react';
import {
  Button,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';

const styles = StyleSheet.create({
  container: {
    margin: 15,
  },
  headerText: {
    color: 'black',
    fontSize: 20,
    marginVertical: 8,
  },
  textInputView: {
    display: 'flex',
    flexDirection: 'row',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  confirmButton: {
    alignSelf: 'center',
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
  },
  textInput: {
    color: '#000000',
    height: 40,
    marginVertical: 8,
  },
  orText: {
    marginVertical: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
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

const JoinCallScreen = () => {
  const [ringingUserIdsText, setRingingUserIdsText] = useState<string>('');
  const username = useAppGlobalStoreValue((store) => store.username);
  const ringingUsers = useAppGlobalStoreValue((store) => store.ringingUsers);
  const client = useStreamVideoClient();

  const users = [
    { id: 'steve', name: 'Steve Galilli' },
    { id: 'khushal', name: 'Khushal Agarwal' },
    { id: 'santhosh', name: 'Santhosh Vaiyapuri' },
    { id: 'oliver', name: 'Oliver Lazoroski' },
    { id: 'zita', name: 'Zita Szupera' },
  ];

  const setState = useAppGlobalStoreSetState();

  const startCallHandler = async () => {
    const callID = uuidv4().toLowerCase();
    let ringingUserIds = !ringingUserIdsText
      ? ringingUsers
      : ringingUserIdsText.split(',').map((ringingUserId) => {
          return {
            userId: ringingUserId,
            role: 'member',
            customJson: new Uint8Array(),
          };
        });
    setState({
      ringingUsers: ringingUserIds,
      ringingCallID: callID,
    });
    if (client) {
      try {
        client.createCall({
          id: callID,
          type: 'default',
          input: {
            ring: true,
            members: ringingUserIds,
          },
        });
      } catch (error) {
        console.log('Failed to createCall', callID, 'default', error);
      }
    }
  };

  const isRingingUserSelected = (userId: string) =>
    ringingUsers.find((ringingUser) => ringingUser.userId === userId);

  const ringingUsersSetHandler = (userId: string) => {
    if (!isRingingUserSelected(userId)) {
      setState({
        ringingUsers: [
          ...ringingUsers,
          { userId: userId, role: 'member', customJson: new Uint8Array() },
        ],
      });
    } else {
      setState({
        ringingUsers: ringingUsers.filter(
          (ringingUser) => ringingUser.userId !== userId,
        ),
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textInputView}>
        <TextInput
          placeholder="Enter comma separated User Ids"
          style={styles.textInput}
          value={ringingUserIdsText}
          onChangeText={(value) => {
            setRingingUserIdsText(value);
          }}
        />
      </View>
      <Text style={styles.orText}>Or</Text>
      <View style={styles.participantsContainer}>
        <Text style={[styles.text, styles.label]}>Select Participants</Text>
        {users
          .filter((user) => user.id !== username)
          .map((user) => {
            return (
              <Pressable
                style={styles.participant}
                key={user.id}
                onPress={() => ringingUsersSetHandler(user.id)}
              >
                <Text
                  style={[
                    styles.text,
                    isRingingUserSelected(user.id)
                      ? styles.selectedParticipant
                      : null,
                  ]}
                >
                  {user.name + ' - id: ' + user.id}
                </Text>
              </Pressable>
            );
          })}
      </View>
      <Button
        disabled={ringingUserIdsText === '' && ringingUsers.length === 0}
        title="Start a Call"
        onPress={startCallHandler}
      />
    </SafeAreaView>
  );
};

export default JoinCallScreen;
