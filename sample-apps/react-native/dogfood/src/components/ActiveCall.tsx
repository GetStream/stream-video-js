import React, { useEffect, useRef } from 'react';
import {
  CallControlsView,
  CallParticipantsBadge,
  CallParticipantsView,
  CallingState,
  useCall,
  useIncallManager,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { appTheme } from '../theme';
import { useChannelWatch } from '../hooks/useChannelWatch';
import { useUnreadCount } from '../hooks/useUnreadCount';

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

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <CallParticipantsBadge style={styles.iconGroup} />
      <CallParticipantsView />
      <CallControlsView
        chatButton={{
          onPressHandler: () => {
            chatButton?.onPressHandler();
          },
          unreadBadgeCountIndicator,
        }}
        style={styles.callControlsWrapper}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  callControlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: appTheme.spacing.lg,
  },
  iconGroup: {
    position: 'absolute',
    top: appTheme.spacing.lg,
    right: appTheme.spacing.sm,
    zIndex: appTheme.zIndex.IN_FRONT,
  },
});
