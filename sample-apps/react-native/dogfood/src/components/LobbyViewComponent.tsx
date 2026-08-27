import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  JoinCallButton,
  Lobby,
  useCallStateHooks,
  useI18n,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { MeetingStackParamList } from '../../types';
import { appTheme } from '../theme';
import { useOrientation } from '../hooks/useOrientation';
import { isCallEncrypted, isE2EEConfigured } from '../utils/e2ee';
import { LockIcon } from './LockIcon';

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
  const { theme } = useTheme();
  const { useCallSettings } = useCallStateHooks();
  const settings = useCallSettings();
  // An `auto-on` call requires E2EE of every participant, so the backend rejects
  // a join without it. Say so here rather than letting the join fail: the key is
  // entered on the previous screen, and `useE2eeEnabled()` is still false at this
  // point because the SFU has not been asked yet.
  const needsEncryptionKey = isCallEncrypted(settings) && !isE2EEConfigured();

  const JoinCallButtonComponent = useCallback(() => {
    return (
      <>
        {needsEncryptionKey && (
          <View style={styles.encryptionNotice}>
            <LockIcon color={theme.colors.iconWarning} size={14} />
            <Text style={styles.encryptionNoticeText}>
              {t(
                'This call is end-to-end encrypted. Set a meeting key before joining.',
              )}
            </Text>
          </View>
        )}
        <JoinCallButton onPressHandler={onJoinCallHandler} />
        {route.name !== 'MeetingScreen' && (
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
  }, [
    onJoinCallHandler,
    callId,
    navigation,
    route.name,
    t,
    needsEncryptionKey,
    theme,
  ]);

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
  encryptionNotice: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  encryptionNoticeText: {
    color: appTheme.colors.light_gray,
    flex: 1,
    fontSize: 13,
  },
  anonymousButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: appTheme.colors.primary,
    textAlign: 'center',
  },
});
