import React, { useCallback, useState } from 'react';
import {
  Button,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import { MemberRequest } from '@stream-io/video-client';
import { NavigationHeader } from '../../components/NavigationHeader';
import { v4 as uuidv4 } from 'uuid';

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
  const [ringingUsers, setRingingUsers] = useState<string[]>([]);
  const videoClient = useStreamVideoClient();

  const users = [
    { id: 'steve', name: 'Steve Galilli' },
    { id: 'khushal', name: 'Khushal Agarwal' },
    { id: 'santhosh', name: 'Santhosh Vaiyapuri' },
    { id: 'oliver', name: 'Oliver Lazoroski' },
    { id: 'zita', name: 'Zita Szupera' },
  ];

  const startCallHandler = useCallback(async () => {
    let ringingUserIds = !ringingUserIdsText
      ? ringingUsers
      : ringingUserIdsText.split(',');

    // we also need to add our own user id in the members
    ringingUserIds = [...new Set([...ringingUserIds, username])];

    try {
      const call = videoClient?.call('default', uuidv4().toLowerCase());
      await call?.getOrCreate({
        ring: true,
        data: {
          members: ringingUserIds.map<MemberRequest>((ringingUserId) => {
            return {
              user_id: ringingUserId,
            };
          }),
        },
      });
    } catch (error) {
      console.log('Failed to createCall', error);
    }
  }, [ringingUserIdsText, ringingUsers, videoClient, username]);

  const isRingingUserSelected = (userId: string) =>
    ringingUsers.find((ringingUser) => ringingUser === userId);

  const ringingUsersSetHandler = (userId: string) => {
    if (!isRingingUserSelected(userId)) {
      setRingingUsers((prevState) => [...prevState, userId]);
    } else {
      setRingingUsers(
        ringingUsers.filter((ringingUser) => ringingUser !== userId),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavigationHeader />
      <View style={styles.textInputView}>
        <TextInput
          placeholder="Enter comma separated User Ids"
          style={styles.textInput}
          value={ringingUserIdsText}
          autoCapitalize="none"
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
