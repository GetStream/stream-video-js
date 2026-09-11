import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../../contexts';
import { CallingState, videoLoggerSystem } from '@stream-io/video-client';

type LobbyProps = {
  isLive: boolean;
  handleJoinCall?: () => void;
};

export const ViewerLobby = ({ isLive }: LobbyProps) => {
  const styles = useStyles();
  const {
    theme: { livestreamViewerLobby },
  } = useTheme();
  const { t } = useI18n();
  const { useCallStartsAt, useParticipants, useCallCallingState } =
    useCallStateHooks();
  const callingState = useCallCallingState();
  const call = useCall();
  const startsAt = useCallStartsAt();
  const [error, setError] = useState<Error | undefined>(undefined);
  const [countdown, setCountdown] = React.useState(getCountdown(startsAt));
  const participants = useParticipants();

  useEffect(() => {
    if (!startsAt || isLive) return;

    const updateCountdown = () => {
      const timeRemaining = Math.max(0, startsAt.getTime() - Date.now());
      if (timeRemaining <= 0) {
        setCountdown('0:00');
        clearInterval(intervalId);
        return;
      }

      setCountdown(getCountdown(startsAt));
    };

    updateCountdown();

    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [startsAt, isLive]);

  /**
   * Getting the call details is done through `call.get()`.
   * It is essential so that the call is watched and any changes in the call is intercepted.
   */
  useEffect(() => {
    const getCall = async () => {
      if (!call) {
        return;
      }

      try {
        await call.get();
      } catch (err) {
        if (err instanceof Error) {
          const logger = videoLoggerSystem.getLogger('ViewerLobby');
          logger.error('Error getting call:', err);
          setError(err);
        }
      }
    };
    getCall();
  }, [call]);

  if (error) {
    return (
      <View style={[styles.container, livestreamViewerLobby.container]}>
        <Text style={styles.text}>
          Error joining the livestream. Please try again later.
        </Text>
      </View>
    );
  }

  const isJoiningLiveCall = callingState === CallingState.JOINING;
  if (isJoiningLiveCall) {
    return (
      <View style={[styles.container, livestreamViewerLobby.container]}>
        <ActivityIndicator
          size="large"
          color={livestreamViewerLobby.text.color}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, livestreamViewerLobby.container]}>
      <Text style={[styles.text, livestreamViewerLobby.text]}>
        {isLive
          ? t('Livestream is still in progress')
          : startsAt
            ? t('Livestream will start in:')
            : t('Livestream will start soon')}
      </Text>
      {startsAt && !isLive && (
        <Text
          style={[styles.countdownText, livestreamViewerLobby.countdownText]}
        >
          {countdown}
        </Text>
      )}
      {!isLive && participants.length > 0 && (
        <>
          <Text
            style={[
              styles.participantsText,
              livestreamViewerLobby.participantsText,
            ]}
          >
            {`${participants.length} ${t('participants have joined early')}`}
          </Text>
        </>
      )}
      {isLive && (
        <Button title={t('Join Livestream')} onPress={() => call?.join()} />
      )}
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { primitives, semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        text: {
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeLg,
          margin: primitives.spacingMd,
          textAlign: 'center',
        },
        countdownText: {
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeXl,
          fontWeight: primitives.typographyFontWeightBold,
          marginBottom: primitives.spacingMd,
          textAlign: 'center',
        },
        participantsText: {
          color: semantics.textSecondary,
          fontSize: primitives.typographyFontSizeMd,
          marginBottom: primitives.spacingSm,
        },
      }),
    [primitives, semantics],
  );
};

const getCountdown = (startsAt: Date | undefined) => {
  if (!startsAt) {
    return '';
  }

  const now = Date.now();
  const timeRemaining = Math.max(0, startsAt.getTime() - now);

  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
