import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  JoinCallButton,
  type JoinCallButtonProps,
  Lobby,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { MeetingStackParamList } from '../../types';
import { appTheme } from '../theme';
import { useOrientation } from '../hooks/useOrientation';
import { useAppI18n } from '../hooks/useAppI18n';
import { isCallEncrypted } from '../utils/e2ee';
import { useLobbyE2EE } from '../contexts/LobbyE2EEContext';
import { LobbyEncryption } from './LobbyEncryption';
import { Button } from './Button';

type LobbyViewComponentType = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
  onJoinCallHandler: () => void;
};

type LobbyNavigation = LobbyViewComponentType['navigation'];

/**
 * The lobby's Join area: the (key-gated) Join button, the encryption control and
 * the guest escape hatch.
 *
 * A module-level component on purpose. `Lobby` renders whatever it is handed as
 * `JoinCallButton` as a component type, so one rebuilt on every state change
 * would remount the encryption control, wiping its state and dismissing the
 * keyboard mid-typing.
 */
const LobbyJoinSection = ({ onJoinCallHandler }: JoinCallButtonProps) => {
  const { t } = useAppI18n();
  const navigation = useNavigation<LobbyNavigation>();
  const route = useRoute<LobbyViewComponentType['route']>();
  const { useCallSettings } = useCallStateHooks();
  const settings = useCallSettings();
  const e2ee = useLobbyE2EE();
  // An `auto-on` call requires E2EE of every participant, so the backend rejects
  // a non-e2ee join: gate the Join button until a key is provided.
  const needsEncryptionKey =
    isCallEncrypted(settings) && !e2ee?.encryptionKey?.trim();

  return (
    <>
      {needsEncryptionKey ? (
        <Button
          disabled
          title={t(
            'lobby.enterEncryptionKey.text',
            'Enter the shared encryption key to join',
          )}
        />
      ) : (
        <JoinCallButton onPressHandler={onJoinCallHandler} />
      )}
      <LobbyEncryption />
      {route.name !== 'MeetingScreen' && (
        <Pressable
          style={styles.anonymousButton}
          onPress={() => {
            navigation.navigate('MeetingScreen', {
              callId: route.params.callId,
              encryptionKey: e2ee?.encryptionKey,
            });
          }}
        >
          <Text style={styles.anonymousButtonText}>
            {t(
              'lobbyView.joinWithAccount.label',
              'Join with your Stream Account',
            )}
          </Text>
        </Pressable>
      )}
    </>
  );
};

export const LobbyViewComponent = ({
  onJoinCallHandler,
}: LobbyViewComponentType) => {
  const orientation = useOrientation();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Lobby
          onJoinCallHandler={onJoinCallHandler}
          JoinCallButton={LobbyJoinSection}
          landscape={orientation === 'landscape'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  content: {
    flexGrow: 1,
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
