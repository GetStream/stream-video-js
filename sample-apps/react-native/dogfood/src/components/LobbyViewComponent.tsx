import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  JoinCallButton,
  Lobby,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  type JoinCallButtonProps,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MeetingStackParamList } from '../../types';
import { useOrientation } from '../hooks/useOrientation';
import { isCallEncrypted } from '../utils/e2ee';
import { useLobbyE2EE } from '../contexts/LobbyE2EEContext';
import { LobbyEncryption } from './LobbyEncryption';
import { Button } from './Button';
import { useAppI18n } from '../hooks/useAppI18n';
import { NavigationHeader } from './NavigationHeader';

type LobbyViewComponentType = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
  onJoinCallHandler: () => void;
  onCloseHandler: () => void;
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
  const styles = useStyles();
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
  route,
  navigation,
}: LobbyViewComponentType) => {
  const orientation = useOrientation();
  const styles = useStyles();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <NavigationHeader route={route} navigation={navigation} options={{}} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Lobby
          style={styles.lobby}
          onJoinCallHandler={onJoinCallHandler}
          JoinCallButton={LobbyJoinSection}
          landscape={orientation === 'landscape'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const useStyles = () => {
  const {
    theme: { foundations, semantics, primitives },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: semantics.backgroundCoreApp,
        },
        content: {
          flexGrow: 1,
        },
        lobby: {
          paddingHorizontal: 16,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: primitives.spacingSm,
          gap: primitives.spacingXs,
        },
        closeButton: {
          width: foundations.layout.size40,
          height: foundations.layout.size40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        userNameText: {
          flex: 1,
          paddingLeft: primitives.spacingXs,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
        },
        closeIcon: {
          color: semantics.buttonSecondaryText,
        },
        anonymousButton: {
          marginTop: 8,
        },
        anonymousButtonText: {
          fontSize: 20,
          fontWeight: '500',
          color: semantics.buttonPrimaryText,
          textAlign: 'center',
        },
      }),
    [semantics, primitives, foundations],
  );
};
