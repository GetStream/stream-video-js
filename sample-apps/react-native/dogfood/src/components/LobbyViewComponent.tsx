import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LobbyView, theme, useI18n } from '@stream-io/video-react-native-sdk';
import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { MeetingStackParamList } from '../../types';
import { appTheme } from '../theme';

type LobbyViewComponentType = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
  onCallJoinHandler: () => void;
};

export const LobbyViewComponent = ({
  callId,
  navigation,
  route,
  onCallJoinHandler,
}: LobbyViewComponentType) => {
  const { t } = useI18n();
  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      <LobbyView joinCallButton={{ onPressHandler: onCallJoinHandler }} />
      {route.name === 'MeetingScreen' ? (
        <Pressable
          style={styles.anonymousButton}
          onPress={() => {
            navigation.navigate('GuestModeScreen', { callId });
          }}
        >
          <Text style={styles.anonymousButtonText}>
            {t('Join as Guest or Anonymously')}
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
            {t('Join with your Stream Account')}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  anonymousButton: {
    alignItems: 'center',
    marginBottom: appTheme.spacing.lg,
  },
  anonymousButtonText: {
    ...theme.fonts.heading6,
    color: appTheme.colors.primary,
  },
});
