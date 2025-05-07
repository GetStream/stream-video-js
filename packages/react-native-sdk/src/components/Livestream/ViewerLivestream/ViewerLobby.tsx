import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { CallingState } from '@stream-io/video-client';

type LobbyProps = {
  isLive: boolean;
  handleJoinCall?: () => void;
};

export const ViewerLobby = ({ isLive, handleJoinCall }: LobbyProps) => {
  const styles = useStyles();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { useCallStartsAt, useParticipants } = useCallStateHooks();
  const call = useCall();
  const startsAt = useCallStartsAt();
  const [error, setError] = useState<Error | undefined>(undefined);
  const [countdown, setCountdown] = React.useState('');
  const participants = useParticipants();

  // Automatically join call when isLive becomes true
  useEffect(() => {
    if (isLive && handleJoinCall) {
      handleJoinCall();
    }
  }, [isLive, handleJoinCall]);

  useEffect(() => {
    if (!startsAt || isLive) return;

    const updateCountdown = () => {
      const now = Date.now();
      const timeRemaining = Math.max(0, startsAt.getTime() - now);

      if (timeRemaining <= 0) {
        setCountdown('0:00');
        clearInterval(intervalId);
        return;
      }

      const minutes = Math.floor(timeRemaining / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
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
          setError(err);
        }
      }
    };
    getCall();
  }, [call]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Error joining the livestream. Please try again later.
        </Text>
      </View>
    );
  }

  const isJoiningLiveCall =
    isLive || call?.state.callingState === CallingState.JOINING;

  if (isJoiningLiveCall) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.textPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {isLive
          ? t('Stream is ready!')
          : startsAt
            ? t('Livestream will start in:')
            : t('Livestream will start soon')}
      </Text>
      {startsAt && !isLive && (
        <Text style={styles.countdownText}>{countdown}</Text>
      )}
      {!isLive && participants.length > 0 && (
        <>
          <Text style={styles.participantsText}>
            {`${participants.length} ${t('participants have joined early')}`}
          </Text>
        </>
      )}
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.sheetPrimary,
          padding: theme.variants.spacingSizes.lg,
        },
        text: {
          color: theme.colors.textPrimary,
          fontSize: theme.variants.fontSizes.lg,
          margin: theme.variants.spacingSizes.md,
          textAlign: 'center',
        },
        countdownText: {
          color: theme.colors.textPrimary,
          fontSize: theme.variants.fontSizes.xl,
          fontWeight: 'bold',
          marginBottom: theme.variants.spacingSizes.md,
          textAlign: 'center',
        },
        participantsText: {
          color: theme.colors.textSecondary,
          fontSize: theme.variants.fontSizes.md,
          marginBottom: theme.variants.spacingSizes.sm,
        },
      }),
    [theme],
  );
};
