import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { ShieldBadge } from '../../../icons';
import { useCall } from '@stream-io/video-react-bindings';
import { CallSessionResponse, StreamCallEvent } from '@stream-io/video-client';

/**
 * Props for the HostDurationBadge component.
 */
export type DurationBadgeProps = {
  mode?: 'host' | 'viewer';
};

/**
 * The HostDurationBadge component displays the duration while the live stream is active.
 */
export const DurationBadge = ({ mode }: DurationBadgeProps) => {
  const [duration, setDuration] = useState(0);
  const call = useCall();
  const {
    theme: {
      colors,
      variants: { iconSizes },
      durationBadge,
    },
  } = useTheme();

  useEffect(() => {
    let intervalId: NodeJS.Timer;
    const handleLiveStarted = () => {
      intervalId = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    };

    const handleLiveEnded = (event: StreamCallEvent) => {
      const callDetails = (
        event as StreamCallEvent & {
          call: { session: CallSessionResponse };
        }
      ).call.session;
      if (callDetails?.live_ended_at !== null) {
        clearInterval(intervalId);
      }
    };

    if (mode === 'host') {
      call?.on('call.live_started', handleLiveStarted);
      call?.on('call.updated', handleLiveEnded);
    } else {
      handleLiveStarted();
    }

    return () => {
      if (mode === 'host') {
        call?.off('call.live_started', handleLiveStarted);
        call?.off('call.updated', handleLiveEnded);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [call, mode]);

  const timestamp = new Date(duration * 1000).toISOString().slice(11, 19);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.dark_gray },
        durationBadge.container,
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            height: iconSizes.xs,
            width: iconSizes.xs,
          },
          durationBadge.icon,
        ]}
      >
        <ShieldBadge />
      </View>
      <Text
        style={[
          styles.label,
          { color: colors.static_white },
          durationBadge.label,
        ]}
      >
        {timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {},
  label: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '400',
    flexShrink: 1,
    includeFontPadding: false,
    paddingLeft: 4,
  },
});
