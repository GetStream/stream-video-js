import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CallDuration } from '../../assets/CallDuration';
import { RecordCall } from '@stream-io/video-react-native-sdk/src/icons/RecordCall';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { useCallStateHooks, useTheme } from '@stream-io/video-react-native-sdk';

/**
 * Props for the CallStatusBadge component.
 */
interface CallStatusBadgeProps {
  /**
   * Indicates if the call is currently being recorded.
   * When true, it shows "Recording in progress..." and a specific icon.
   * When false, it shows the elapsed time.
   */
  isCallRecorded: boolean;
}

/**
 * CallStatusBadge component to display the current status of a call.
 * It shows either a recording message or the elapsed time, with an accompanying icon.
 *
 * @param {CallStatusBadgeProps} props - The props for the component.
 */
export const CallStatusBadge: React.FC<CallStatusBadgeProps> = ({
  isCallRecorded,
}) => {
  const {
    theme: {
      colors,
      variants: { iconSizes },
    },
  } = useTheme();

  // TODO: replace this with useDuration when that https://github.com/GetStream/stream-video-js/pull/1528 is merged
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  useEffect(() => {
    const startedAt = new Date().getTime();
    setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    const intervalId = setInterval(() => {
      setElapsedSeconds((prevSeconds) => prevSeconds + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const styles = useStyles(isCallRecorded);

  // Format duration to MM:SS
  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
  const timestamp = `${minutes}:${seconds}`;
  const text = isCallRecorded ? 'Recording in progress...' : timestamp;

  const icon = isCallRecorded ? (
    <RecordCall color={colors.iconAlertWarning} size={iconSizes.md} />
  ) : (
    <CallDuration color={colors.iconAlertSuccess} size={iconSizes.md} />
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

const useStyles = (isCallRecorded: boolean) => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.buttonSecondaryDefault,
          borderRadius: 8,
          flexDirection: 'row',
          height: 36,
          paddingLeft: 17,
          paddingRight: 5,
          justifyContent: 'center',
          alignItems: 'center',
          width: isCallRecorded ? 200 : 80,
        },
        text: {
          color: theme.colors.typePrimary,
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
    [theme, isCallRecorded],
  );
};
