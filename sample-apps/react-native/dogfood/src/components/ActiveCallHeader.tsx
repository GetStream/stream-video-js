import React, { useEffect, useRef } from 'react';
import { CallingState, useCallCallingState } from '@stream-io/video-react-sdk';
import { ActivityIndicator, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appTheme } from '../theme';
import InfoIconSvg from '../assets/InfoIconSvg';

export const ActiveCallHeader = () => {
  const callingState = useCallCallingState();
  const header = getHeader(callingState);

  if (!header) {
    return null;
  }

  const showLoadingIndicator =
    callingState === CallingState.JOINING ||
    callingState === CallingState.RECONNECTING;

  return (
    <AnimatedHeader
      key={header}
      header={header}
      showLoadingIndicator={showLoadingIndicator}
    />
  );
};

const AnimatedHeader = ({
  header,
  showLoadingIndicator,
}: {
  header: string;
  showLoadingIndicator: boolean;
}) => {
  const { top } = useSafeAreaInsets();
  const opacityAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top,
          opacity: opacityAnim,
          transform: [
            {
              translateY: opacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0], // 0 : 150, 0.5 : 75, 1 : 0
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
    padding: appTheme.spacing.xs,
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
