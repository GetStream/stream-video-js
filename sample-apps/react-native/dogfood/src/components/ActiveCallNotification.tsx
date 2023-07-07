import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appTheme } from '../theme';
import InfoIconSvg from '../assets/InfoIconSvg';
import { useCallCallingState } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';

export const ActiveCallNotification = () => {
  const callingState = useCallCallingState();
  const header = getHeader(callingState);

  if (!header) {
    return null;
  }

  const showLoadingIndicator =
    callingState === CallingState.JOINING ||
    callingState === CallingState.RECONNECTING;

  return (
    <AnimatedContainer
      header={header}
      showLoadingIndicator={showLoadingIndicator}
    />
  );
};

const AnimatedContainer = ({
  header,
  showLoadingIndicator,
}: {
  header: string;
  showLoadingIndicator: boolean;
}) => {
  const { top } = useSafeAreaInsets();
  const opacityAnimRef = useRef(new Animated.Value(0)); // Initial value for opacity: 0

  useEffect(() => {
    const opacityAnim = opacityAnimRef.current;
    opacityAnim.setValue(0);
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // dep to header, because we restart animation whenever header change
  }, [header]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top,
          opacity: opacityAnimRef.current,
          transform: [
            {
              translateY: opacityAnimRef.current.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0], // move from top to position
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
      key={header}
    >
      {showLoadingIndicator ? (
        <ActivityIndicator color="#999" size="small" />
      ) : (
        <InfoIconSvg height={16} width={16} />
      )}
      <Text style={styles.header}>{header}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
    backgroundColor: '#1c1e22',
    borderRadius: appTheme.spacing.xs,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '90%',
    margin: appTheme.spacing.xs,
    paddingVertical: appTheme.spacing.xs,
    paddingHorizontal: appTheme.spacing.sm,
  },
  header: {
    textAlign: 'center',
    borderRadius: appTheme.spacing.xs,
    fontSize: 16,
    color: appTheme.colors.static_white,
    marginLeft: appTheme.spacing.sm,
    flexShrink: 1,
  },
});

const getHeader = (callingState: CallingState): string | null => {
  switch (callingState) {
    case CallingState.OFFLINE:
      return 'You are offline. Check your internet connection and try again later.';
    case CallingState.JOINING:
      return 'Joining...';
    case CallingState.RECONNECTING:
      return 'Reconnecting...';
    case CallingState.RECONNECTING_FAILED:
      return 'Failed to restore connection. Check your internet connection and try again later.';
    case CallingState.MIGRATING:
      return 'Migrating...';
    default:
      return null;
  }
};
