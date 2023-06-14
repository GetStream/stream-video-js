import React, { useEffect, useState } from 'react';
import { theme, useCall } from '@stream-io/video-react-native-sdk';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../../types';

type GuestModeScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'GuestModeScreen'
>;

export const GuestModeScreen = ({
  navigation,
  route,
}: GuestModeScreenProps) => {
  const call = useCall();
  const [callId, setCallId] = useState<string>(route.params.callId);
  const [username, setUsername] = useState<string>('Guest');

  useEffect(() => {
    if (call) {
      setCallId(call.id);
    }
  }, [call]);

  const joinAsGuestHandler = () => {
    navigation.navigate('GuestMeetingScreen', {
      mode: 'guest',
      guestUserId: username,
      guestCallId: callId,
    });
  };

  const joinAnonymously = () => {
    navigation.navigate('GuestMeetingScreen', {
      mode: 'anon',
      guestCallId: callId,
      guestUserId: '!anon',
    });
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      <Text style={styles.title}>Guest Mode</Text>
      <View style={styles.inputs}>
        <TextInput
          placeholder="Meeting Id"
          value={callId}
          onChangeText={(value) => setCallId(value)}
          style={styles.input}
          placeholderTextColor={'gray'}
        />
        <TextInput
          placeholder="Your name"
          value={username}
          onChangeText={(value) => setUsername(value)}
          style={styles.input}
          placeholderTextColor={'gray'}
        />
      </View>
      <View style={styles.buttons}>
        <Pressable style={styles.joinButton} onPress={joinAsGuestHandler}>
          <Text style={styles.joinButtonText}>Join As Guest</Text>
        </Pressable>
        <Pressable style={styles.anonymousButton} onPress={joinAnonymously}>
          <Text style={styles.anonymousButtonText}>Continue Anonymously</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.fonts.heading4,
    color: theme.light.static_white,
  },
  inputs: {},
  input: {
    height: 50,
    width: 300,
    margin: 12,
    backgroundColor: '#1C1E22',
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    borderRadius: 5,
    color: theme.light.static_white,
  },
  buttons: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: theme.light.primary,
    borderRadius: theme.rounded.sm,
    marginTop: theme.margin.md,
    justifyContent: 'center',
    paddingVertical: theme.padding.sm,
    width: 200,
  },
  joinButtonText: {
    color: theme.light.static_white,
    textAlign: 'center',
    ...theme.fonts.subtitleBold,
  },
  anonymousButton: {
    alignItems: 'center',
    marginTop: theme.margin.md,
  },
  anonymousButtonText: {
    ...theme.fonts.heading6,
    color: theme.light.primary,
  },
});
