import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { ShieldBadge } from '../../../icons';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
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
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();

  const [duration, setDuration] = useState(() => {
    if (!session || !session.live_started_at) {
      return 0;
    }
    const liveStartTime = new Date(session.live_started_at);
    const now = new Date();
    return Math.floor((now.getTime() - liveStartTime.getTime()) / 1000);
  });

  const call = useCall();
  const {
    theme: {
      colors,
      variants: { iconSizes },
      durationBadge,
    },
  } = useTheme();

  // for host
  useEffect(() => {
    if (mode !== 'host') {
      return;
    }
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

    const callLiveStartedUnsubscribe = call?.on(
      'call.live_started',
      handleLiveStarted,
    );
    const callUpdatedUnsubscribe = call?.on('call.updated', handleLiveEnded);

    return () => {
      if (mode !== 'host') {
        return;
      }
      if (callLiveStartedUnsubscribe && callUpdatedUnsubscribe) {
        callLiveStartedUnsubscribe();
        callUpdatedUnsubscribe();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [call, mode]);

  // for viewer
  useEffect(() => {
    if (mode !== 'viewer') {
      return;
    }
    let intervalId: NodeJS.Timer;
    const handleLiveStarted = () => {
      intervalId = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    };

    handleLiveStarted();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [mode]);

  const formatDuration = (durationInMs: number) => {
    const days = Math.floor(durationInMs / 86400);
    const hours = Math.floor(durationInMs / 3600);
    const minutes = Math.floor((durationInMs % 3600) / 60);
    const seconds = durationInMs % 60;

    return `${days ? days + ' ' : ''}${hours ? hours + ':' : ''}${
      minutes < 10 ? '0' : ''
    }${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

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
        {formatDuration(duration)}
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
