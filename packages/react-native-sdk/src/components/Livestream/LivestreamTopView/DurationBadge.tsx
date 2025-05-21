import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  type CallSessionResponse,
  type StreamCallEvent,
} from '@stream-io/video-client';

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
  const styles = useStyles();
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
    theme: { colors, durationBadge },
  } = useTheme();

  // for host
  useEffect(() => {
    if (mode !== 'host') {
      return;
    }
    let intervalId: NodeJS.Timeout;

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
    let intervalId: NodeJS.Timeout;
    const handleLiveStarted = () => {
      intervalId = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    };

    handleLiveStarted();

    return () => {
      if (mode !== 'viewer') {
        return;
      }
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
        { backgroundColor: colors.sheetTertiary },
        durationBadge.container,
      ]}
    >
      <View style={[styles.dot, durationBadge.icon]} />
      <Text
        style={[
          styles.label,
          { color: colors.textPrimary },
          durationBadge.label,
        ]}
      >
        {formatDuration(duration)}
      </Text>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: theme.variants.spacingSizes.sm,
          paddingVertical: theme.variants.spacingSizes.sm,
          borderRadius: theme.variants.borderRadiusSizes.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        dot: {
          backgroundColor: theme.colors.iconWarning,
          marginRight: theme.variants.spacingSizes.xs,
          borderRadius: 90,
          height: 10,
          width: 10,
        },
        label: {
          textAlign: 'center',
          fontSize: theme.variants.fontSizes.md,
          fontWeight: '600',
          flexShrink: 1,
          paddingLeft: theme.variants.spacingSizes.xs,
        },
      }),
    [theme],
  );
};
