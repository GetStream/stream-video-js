import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LobbyView, theme } from '@stream-io/video-react-native-sdk';
import React from 'react';
import { Text } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { MeetingStackParamList } from '../../types';

type LobbyViewComponentType = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
  mode?: string;
};

export const LobbyViewComponent = ({
  callId,
  mode,
  navigation,
  route,
}: LobbyViewComponentType) => {
  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      <LobbyView enablePreview={mode !== 'anon'} />
      {route.name === 'MeetingScreen' ? (
        <Pressable
          style={styles.anonymousButton}
          onPress={() => {
            navigation.navigate('GuestModeScreen', { callId });
          }}
        >
          <Text style={styles.anonymousButtonText}>
            Join as Guest or Anonymously
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.anonymousButton}
          onPress={() => {
            navigation.navigate('MeetingScreen', { callId });
          }}
        >
          <Text style={styles.anonymousButtonText}>
            Join with your Stream Account
          </Text>
        </Pressable>
      )}
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
