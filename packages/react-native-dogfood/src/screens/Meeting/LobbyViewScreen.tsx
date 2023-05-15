import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  LobbyView,
  UserResponse,
  theme,
  useCall,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { MeetingStackParamList } from '../../../types';
import { createToken } from '../../modules/helpers/jwt';

type LobbyViewScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'LobbyViewScreen'
>;

export const LobbyViewScreen = ({
  navigation,
  route,
}: LobbyViewScreenProps) => {
  const apiKey = process.env.STREAM_API_KEY as string;
  const secretKey = process.env.STREAM_API_SECRET as string;
  const call = useCall();

  const {
    params: { guestUserId, mode },
  } = route;

  const user: UserResponse = {
    id: `anonymous-${Math.random().toString(36).substring(2, 15)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'guest',
    teams: [],
    custom: {},
  };
  const [userToConnect, setUserToConnect] = useState(user);
  const [tokenToUse, setTokenToUse] = useState<string | undefined>(undefined);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: tokenToUse,
    user: userToConnect,
    isAnonymous: isAnonymous,
  });

  useEffect(() => {
    if (call) {
      const intitializeToken = async () => {
        if (mode) {
          // anonymous user tokens must have "!anon" as the user_id
          const token = await createToken('!anon', secretKey, {
            user_id: '!anon',
            call_cids: [`${call?.type}:${call?.id}`],
          });
          setTokenToUse(token);
        }
      };

      intitializeToken();
    }
  }, [call, secretKey, mode]);

  useEffect(() => {
    if (mode !== 'guest') {
      return;
    }
    if (guestUserId) {
      client
        .createGuestUser({
          user: {
            id: guestUserId,
            name: guestUserId,
            role: 'guest',
          },
        })
        .then((guestUser) => {
          console.log({ guestUser });
          setUserToConnect(guestUser.user);
          setTokenToUse(guestUser.access_token);
          setIsAnonymous(false);
        })
        .catch((err) => {
          console.error('Error creating guest user', err);
        });
    }
  }, [client, guestUserId, mode]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      <LobbyView />
      <Pressable
        style={styles.anonymousButton}
        onPress={() => {
          navigation.navigate('GuestModeScreen');
        }}
      >
        <Text style={styles.anonymousButtonText}>
          Join as Guest or Anonymously
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  anonymousButton: {
    alignItems: 'center',
    marginBottom: theme.margin.md,
  },
  anonymousButtonText: {
    ...theme.fonts.heading6,
    color: theme.light.primary,
  },
});
