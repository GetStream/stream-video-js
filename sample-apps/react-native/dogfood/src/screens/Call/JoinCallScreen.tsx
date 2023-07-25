import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import { MemberRequest } from '@stream-io/video-client';
import { appTheme } from '../../theme';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { KnownUsers } from '../../constants/KnownUsers';
import { randomId } from '../../modules/helpers/randomId';

const JoinCallScreen = () => {
  const [ringingUserIdsText, setRingingUserIdsText] = useState<string>('');
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const [ringingUsers, setRingingUsers] = useState<string[]>([]);
  const videoClient = useStreamVideoClient();

  const startCallHandler = useCallback(async () => {
    let ringingUserIds = !ringingUserIdsText
      ? ringingUsers
      : ringingUserIdsText.split(',');

    // we also need to add our own user id in the members
    ringingUserIds = [...new Set([...ringingUserIds, userId])];

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
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error calling users', error.message);
      }
      console.log('Failed to createCall', error);
    }
  }, [ringingUserIdsText, ringingUsers, videoClient, userId]);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
    >
      <View>
        <Text style={styles.headerText}>Select Participants</Text>
        {KnownUsers.filter((user) => user.id !== userId).map((user) => {
          return (
            <Pressable
              style={styles.participant}
              key={user.id}
              onPress={() => ringingUsersSetHandler(user.id)}
            >
              <Image source={{ uri: user.image }} style={styles.avatar} />
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
        <Text style={styles.orText}>Or</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Enter comma separated User ids"
          value={ringingUserIdsText}
          onChangeText={(value) => {
            setRingingUserIdsText(value);
          }}
          style={styles.textInputStyle}
        />
      </View>
      <Button
        title="Start a New Call"
        disabled={ringingUserIdsText === '' && ringingUsers.length === 0}
        onPress={startCallHandler}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.static_grey,
    flex: 1,
    justifyContent: 'space-evenly',
  },
  orText: {
    fontSize: 17,
    color: appTheme.colors.static_white,
    fontWeight: '500',
    marginVertical: appTheme.spacing.lg,
    textAlign: 'center',
  },
  textInputStyle: {
    flex: 0,
  },
  headerText: {
    fontSize: 20,
    color: appTheme.colors.static_white,
    fontWeight: 'bold',
    marginBottom: appTheme.spacing.lg,
  },
  participant: {
    paddingVertical: appTheme.spacing.sm,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedParticipant: {
    color: appTheme.colors.primary,
    fontWeight: 'bold',
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  text: {
    color: appTheme.colors.static_white,
    marginLeft: appTheme.spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default JoinCallScreen;
