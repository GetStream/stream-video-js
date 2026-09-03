import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CallingState,
  useCall,
  useCallStateHooks,
  useIsInPiPMode,
} from '@stream-io/video-react-native-sdk';

/**
 * Overlay badge shown at the top of the active call screen displaying the
 * current call ID. Tapping it opens the share sheet so the ID can be copied
 * or sent. Used by both the meeting and ringing call screens.
 */
export const CallId = () => {
  const call = useCall();
  const isInPiPMode = useIsInPiPMode();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { top } = useSafeAreaInsets();

  // Only show once the call is active, so it never overlays the lobby or the
  // incoming/outgoing ringing UI.
  const isActive =
    callingState === CallingState.JOINED ||
    callingState === CallingState.RECONNECTING;

  if (!call || isInPiPMode || !isActive) {
    return null;
  }

  const callId = call.id;

  const onShare = async () => {
    try {
      await Share.share({ message: callId });
    } catch {
      // share sheet was dismissed or is unavailable, nothing to do
    }
  };

  return (
    <View style={[styles.container, { top: top + 8 }]} pointerEvents="box-none">
      <Pressable
        style={styles.badge}
        onPress={onShare}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Call ID ${callId}`}
        accessibilityHint="Opens the share sheet to copy or send the call ID"
      >
        <Text style={styles.label}>Call ID</Text>
        <Text style={styles.value} numberOfLines={1}>
          {callId}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(39, 42, 48, 0.9)',
  },
  label: {
    color: '#979CA0',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  value: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
