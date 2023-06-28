import React, { useEffect, useRef } from 'react';
import {
  CallControlsView,
  CallParticipantsBadge,
  CallParticipantsView,
  CallingState,
  useCall,
  useIncallManager,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { appTheme } from '../theme';
import { useChannelWatch } from '../hooks/useChannelWatch';
import { useUnreadCount } from '../hooks/useUnreadCount';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type ActiveCallProps = {
  chatButton?: {
    onPressHandler: () => void;
  };
};

export const ActiveCall = ({ chatButton }: ActiveCallProps) => {
  const channelWatched = useChannelWatch();
  const unreadBadgeCountIndicator = useUnreadCount({ channelWatched });

  const call = useCall();
  const activeCallRef = useRef(call);
  activeCallRef.current = call;

  useEffect(() => {
    return () => {
      if (activeCallRef.current?.state.callingState !== CallingState.LEFT) {
        activeCallRef.current?.leave();
      }
    };
  }, []);

  /**
   * This hook is used to handle IncallManager specs of the application.
   */
  useIncallManager({ media: 'video', auto: true });

  const { bottom } = useSafeAreaInsets();

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CallParticipantsBadge style={styles.iconGroup} />
      <CallParticipantsView />
      <CallControlsView
        chatButton={{
          onPressHandler: () => {
            chatButton?.onPressHandler();
          },
          unreadBadgeCountIndicator,
        }}
        style={[
          styles.callControlsWrapper,
          { paddingBottom: Math.max(bottom, appTheme.spacing.lg) },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  iconGroup: {
    position: 'absolute',
    top: appTheme.spacing.lg,
    right: appTheme.spacing.sm,
    zIndex: appTheme.zIndex.IN_FRONT,
  },
  callControlsWrapper: {
    paddingTop: appTheme.spacing.lg,
    paddingHorizontal: appTheme.spacing.sm,
  },
});
