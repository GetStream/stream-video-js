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
import { CallingState } from '@stream-io/video-client';
import { getLogger } from '@stream-io/video-client';

type LobbyProps = {
  isLive: boolean;
  handleJoinCall?: () => void;
};

export const ViewerLobby = ({ isLive }: LobbyProps) => {
  const styles = useStyles();
  const { theme } = useTheme();
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
          const logger = getLogger(['ViewerLobby']);
          logger('error', 'Error getting call:', err);
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

  const isJoiningLiveCall = callingState === CallingState.JOINING;
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
          ? t('Livestream is still in progress')
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
      {isLive && (
        <Button title={t('Join Livestream')} onPress={() => call?.join()} />
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
