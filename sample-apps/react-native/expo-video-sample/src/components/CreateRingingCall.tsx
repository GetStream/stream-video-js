import React, { useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  Alert,
  Pressable,
  Image,
  View,
} from 'react-native';
import { randomId } from '../../utils/randomId';
import { users } from '../data/users';
import { useAppContext } from '../context/AppContext';
import {
  MemberRequest,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { router } from 'expo-router';

export default function CreateRingingCall() {
  const [ringingUsers, setRingingUsers] = useState<string[]>([]);
  const videoClient = useStreamVideoClient();
  const { user: currentUser } = useAppContext();
  const currentUserId = currentUser!.id!;

  const startCallHandler = async () => {
    // we also need to add our own user id in the members
    const ringingUserIds = [...new Set([...ringingUsers, currentUserId])];

    try {
      const call = videoClient?.call('default', randomId());
      await call?.getOrCreate({
        ring: true,
        data: {
          // more timeout to cancel the call automatically so that it works when callee's app is in quit state
          settings_override: { ring: { auto_cancel_timeout_ms: 60000 } },
          members: ringingUserIds.map<MemberRequest>((ringingUserId) => {
            return {
              user_id: ringingUserId,
            };
          }),
        },
      });
      router.push('/ringing');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error calling users', error.message);
      }
      console.log('Failed to createCall', error);
    }
  };

  const isRingingUserSelected = (userid: string) =>
    ringingUsers.find((ringingUser) => ringingUser === userid);

  const ringingUsersSetHandler = (userid: string) => {
    if (!isRingingUserSelected(userid)) {
      setRingingUsers((prevState) => [...prevState, userid]);
    } else {
      setRingingUsers(
        ringingUsers.filter((ringingUser) => ringingUser !== userid),
      );
    }
  };

  return (
    <>
      <Text
        style={styles.headerText}
      >{`Ringing call - Select Participants`}</Text>
      {users
        .filter((user) => user.id !== currentUserId)
        .map((user) => {
          return (
            <Pressable
              style={styles.participant}
              key={user.id}
              onPress={() => ringingUsersSetHandler(user.id)}
            >
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              <Text
                style={[
                  styles.ringingParticipantText,
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
      <View style={styles.button}>
        <Button
          title={'Start a New Ringing Call'}
          disabled={ringingUsers.length === 0}
          onPress={startCallHandler}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerText: {
    color: 'black',
    fontSize: 20,
    marginVertical: 8,
  },
  participant: {
    paddingVertical: 4,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedParticipant: {
    color: '#005FFF',
    fontWeight: 'bold',
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  ringingParticipantText: {
    color: 'black',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    marginVertical: 8,
  },
});
