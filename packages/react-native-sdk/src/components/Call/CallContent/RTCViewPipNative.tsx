import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { videoLoggerSystem } from '@stream-io/video-client';
import NativeComponent, {
  Commands,
} from '../../../native/RTCViewPipNativeComponent';

export type RTCViewPipNativeRef = React.ComponentRef<typeof NativeComponent>;

export type PiPChangeEvent = {
  active: boolean;
};

export type PiPBoundsChangeEvent = {
  /** the laid out width of the native window, in logical points */
  width: number;
  /** the laid out height of the native window, in logical points */
  height: number;
};

type RTCViewPipNativeProps = {
  streamURL?: string;
  mirror?: boolean;
  onPiPChange?: (event: { nativeEvent: PiPChangeEvent }) => void;
  /**
   * Reports the actual laid out bounds of the native Picture in Picture window.
   */
  onPiPBoundsChange?: (event: { nativeEvent: PiPBoundsChangeEvent }) => void;
  /** The participant's name for the avatar placeholder when video is disabled */
  participantName?: string;
  /** The URL string for the participant's profile image */
  participantImageURL?: string;
  /** Whether the call is reconnecting - when true, shows reconnection view */
  isReconnecting?: boolean;
  /** Whether screen sharing is active (used for content state tracking) */
  isScreenSharing?: boolean;
  /** Whether the participant has audio enabled (shown in participant overlay) */
  hasAudio?: boolean;
  /** Whether the video track is paused (shown in participant overlay) */
  isTrackPaused?: boolean;
  /** Whether the participant is pinned (shown in participant overlay) */
  isPinned?: boolean;
  /** Whether the participant is currently speaking (shows border highlight) */
  isSpeaking?: boolean;
  /** The connection quality level (0: unknown, 1: poor, 2: good, 3: excellent) */
  connectionQuality?: number;
  ref?: React.Ref<RTCViewPipNativeRef>;
};

export function onNativeCallClosed(ref: RTCViewPipNativeRef | null) {
  if (Platform.OS !== 'ios' || !ref) return;
  videoLoggerSystem.getLogger('RTCViewPipNative').debug('onNativeCallClosed');
  Commands.onCallClosed(ref);
}

export function onNativeDimensionsUpdated(
  ref: RTCViewPipNativeRef | null,
  width: number,
  height: number,
) {
  if (Platform.OS !== 'ios' || !ref) return;
  videoLoggerSystem
    .getLogger('RTCViewPipNative')
    .debug('onNativeDimensionsUpdated', {
      width,
      height,
    });
  Commands.setPreferredContentSize(ref, width, height);
}

/** Wrapper for the native view
 * meant to stay private and not exposed */
export const RTCViewPipNative = React.memo((props: RTCViewPipNativeProps) => {
  if (Platform.OS !== 'ios') return null;

  return (
    <NativeComponent
      style={StyleSheet.absoluteFill}
      pointerEvents={'none'}
      streamURL={props.streamURL}
      mirror={props.mirror}
      onPiPChange={props.onPiPChange}
      onPiPBoundsChange={props.onPiPBoundsChange}
      participantName={props.participantName}
      participantImageURL={props.participantImageURL}
      isReconnecting={props.isReconnecting}
      isScreenSharing={props.isScreenSharing}
      hasAudio={props.hasAudio}
      isTrackPaused={props.isTrackPaused}
      isPinned={props.isPinned}
      isSpeaking={props.isSpeaking}
      connectionQuality={props.connectionQuality}
      ref={props.ref}
    />
  );
});

RTCViewPipNative.displayName = 'RTCViewPipNative';
