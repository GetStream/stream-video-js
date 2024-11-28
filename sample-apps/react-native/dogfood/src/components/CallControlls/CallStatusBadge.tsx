import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CallDuration } from '../../assets/CallDuration';
import { RecordCall } from '../../assets/RecordCall';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { useTheme } from '@stream-io/video-react-native-sdk';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

const formatTime = (seconds: number) => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const format = date.toISOString();
  const hours = format.substring(11, 13);
  const minutes = format.substring(14, 16);
  const seconds_str = format.substring(17, 19);
  return `${hours !== '00' ? hours + ':' : ''}${minutes}:${seconds_str}`;
};

export type CallStatusBadgeProps = {
  isCallRecordingInProgress: boolean;
  isAwaitingResponse: boolean;
};

export const CallStatusBadge: React.FC<CallStatusBadgeProps> = ({
  isCallRecordingInProgress,
  isAwaitingResponse,
}) => {
  const {
    theme: {
      colors,
      variants: { iconSizes },
    },
  } = useTheme();

  // TODO: replace this with useDuration when that https://github.com/GetStream/stream-video-js/pull/1528 is merged
  const [elapsed, setElapsed] = useState<string>('00:00');
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();
  const startedAt = session?.started_at;
  const startedAtDate = useMemo(() => {
    if (!startedAt) {
      return Date.now();
    }
    const date = new Date(startedAt).getTime();
    return isNaN(date) ? Date.now() : date;
  }, [startedAt]);

  useEffect(() => {
    const initialElapsedSeconds = Math.max(
      0,
      (Date.now() - startedAtDate) / 1000,
    );

    setElapsed(formatTime(initialElapsedSeconds));

    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAtDate) / 1000;
      setElapsed(formatTime(elapsedSeconds));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAtDate]);

  const styles = useStyles(isAwaitingResponse);
  const recordingMessage = isCallRecordingInProgress
    ? 'Stopping recording...'
    : 'Recording in progress...';

  let text = isAwaitingResponse ? recordingMessage : elapsed;
  const showRecordingIcon = isCallRecordingInProgress || isAwaitingResponse;

  const icon = showRecordingIcon ? (
    <RecordCall color={colors.iconWarning} size={iconSizes.md} />
  ) : (
    <CallDuration color={colors.iconSuccess} size={iconSizes.sm} />
  );

  return (
    <View style={styles.container}>
      <IconWrapper>
        <View style={styles.icon}>{icon}</View>
      </IconWrapper>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const useStyles = (isLoading: boolean) => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.buttonSecondary,
          borderRadius: 8,
          flexDirection: 'row',
          height: 36,
          paddingLeft: 17,
          paddingRight: 5,
          justifyContent: 'center',
          alignItems: 'center',
          width: isLoading ? 200 : 80,
        },
        text: {
          color: theme.colors.textPrimary,
          fontSize: 14,
          fontWeight: '600',
          flexShrink: 0,
          marginLeft: 10,
          minWidth: 41,
        },
        icon: {
          marginTop: 2,
          marginRight: 5,
        },
      }),
    [theme, isLoading],
  );
};
