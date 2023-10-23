import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  JoinCallButton,
  Lobby,
  useI18n,
} from '@stream-io/video-react-native-sdk';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { MeetingStackParamList } from '../../types';
import { appTheme } from '../theme';
import { useOrientation } from '../hooks/useOrientation';

type LobbyViewComponentType = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
  onJoinCallHandler: () => void;
};

export const LobbyViewComponent = ({
  callId,
  navigation,
  route,
  onJoinCallHandler,
}: LobbyViewComponentType) => {
  const { t } = useI18n();
  const orientation = useOrientation();

  const JoinCallButtonComponent = useCallback(() => {
    return (
      <>
        <JoinCallButton onPressHandler={onJoinCallHandler} />
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
      </>
    );
  }, [onJoinCallHandler, callId, navigation, route.name, t]);

  return (
    <View style={styles.container}>
      <Lobby
        JoinCallButton={JoinCallButtonComponent}
        landscape={orientation === 'landscape'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  anonymousButton: {
    marginTop: 8,
  },
  anonymousButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: appTheme.colors.primary,
    textAlign: 'center',
  },
});
