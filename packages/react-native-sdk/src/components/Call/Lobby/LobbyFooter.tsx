import React from 'react';
import { LobbyProps } from './Lobby';
import { View, StyleSheet, Text } from 'react-native';
import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the Lobby Footer in the Lobby component.
 */
export type LobbyFooterProps = Pick<
  LobbyProps,
  'onJoinCallHandler' | 'JoinCallButton'
>;

/**
 * The default Lobby Footer to be used in the Lobby component.
 */
export const LobbyFooter = ({
  onJoinCallHandler,
  JoinCallButton,
}: LobbyFooterProps) => {
  const {
    theme: { colors, lobby, typefaces },
  } = useTheme();
  const { useCallSession } = useCallStateHooks();

  const { t } = useI18n();

  const call = useCall();
  const session = useCallSession();

  const participantsCount = session?.participants.length;

  return (
    <View
      style={[
        styles.infoContainer,
        { backgroundColor: colors.static_overlay },
        lobby.infoContainer,
      ]}
    >
      <Text
        style={[
          { color: colors.static_white },
          typefaces.subtitleBold,
          lobby.infoText,
        ]}
      >
        {t('You are about to join a call with id {{ callId }}.', {
          callId: call?.id,
        }) +
          ' ' +
          (participantsCount
            ? t('{{ numberOfParticipants }} participant(s) are in the call.', {
                numberOfParticipants: participantsCount,
              })
            : t('You are first to join the call.'))}
      </Text>
      {JoinCallButton && (
        <JoinCallButton onJoinCallHandler={onJoinCallHandler} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    padding: 12,
    borderRadius: 10,
  },
});
