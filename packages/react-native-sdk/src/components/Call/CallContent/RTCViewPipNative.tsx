import React from 'react';
import {
  type HostComponent,
  Platform,
  requireNativeComponent,
  StyleSheet,
  UIManager,
} from 'react-native';
import { videoLoggerSystem } from '@stream-io/video-client';

const COMPONENT_NAME = 'RTCViewPip';

export type PiPChangeEvent = {
  active: boolean;
};

type RTCViewPipNativeProps = {
  streamURL?: string;
  onPiPChange?: (event: { nativeEvent: PiPChangeEvent }) => void;
  /** The participant's name for the avatar placeholder when video is disabled */
  participantName?: string;
  /** The URL string for the participant's profile image */
  participantImageURL?: string;
  /** Whether video is enabled - when false, shows avatar placeholder */
  isVideoEnabled?: boolean;
  /** Whether the call is reconnecting - when true, shows reconnection view */
  isReconnecting?: boolean;
  /** Whether screen sharing is active - when true, shows screen share indicator */
  isScreenSharing?: boolean;
  /** Whether the participant's audio is muted - shown in participant overlay */
  isMuted?: boolean;
};

const NativeComponent: HostComponent<RTCViewPipNativeProps> =
  requireNativeComponent(COMPONENT_NAME);

export function onNativeCallClosed(reactTag: number) {
  videoLoggerSystem.getLogger('RTCViewPipNative').debug('onNativeCallClosed');
  const commandId =
    UIManager.getViewManagerConfig(COMPONENT_NAME).Commands.onCallClosed;
  if (!commandId) return;
  UIManager.dispatchViewManagerCommand(reactTag, commandId, []);
}

export function onNativeDimensionsUpdated(
  reactTag: number,
  width: number,
  height: number,
) {
  videoLoggerSystem
    .getLogger('RTCViewPipNative')
    .debug('onNativeDimensionsUpdated', {
      width,
      height,
    });
  const commandId =
    UIManager.getViewManagerConfig(COMPONENT_NAME).Commands
      .setPreferredContentSize;
  if (!commandId) return;
  UIManager.dispatchViewManagerCommand(reactTag, commandId, [width, height]);
}

/** Wrapper for the native view
 * meant to stay private and not exposed */
export const RTCViewPipNative = React.memo(
  React.forwardRef<
    React.Ref<any>,
    {
      streamURL?: string;
      onPiPChange?: (event: { nativeEvent: PiPChangeEvent }) => void;
      participantName?: string;
      participantImageURL?: string;
      isVideoEnabled?: boolean;
      isReconnecting?: boolean;
      isScreenSharing?: boolean;
      isMuted?: boolean;
    }
  >((props, ref) => {
    if (Platform.OS !== 'ios') return null;

    return (
      <NativeComponent
        style={StyleSheet.absoluteFill}
        pointerEvents={'none'}
        // eslint-disable-next-line react/prop-types
        streamURL={props.streamURL}
        // eslint-disable-next-line react/prop-types
        onPiPChange={props.onPiPChange}
        // eslint-disable-next-line react/prop-types
        participantName={props.participantName}
        // eslint-disable-next-line react/prop-types
        participantImageURL={props.participantImageURL}
        // eslint-disable-next-line react/prop-types
        isVideoEnabled={props.isVideoEnabled}
        // eslint-disable-next-line react/prop-types
        isReconnecting={props.isReconnecting}
        // eslint-disable-next-line react/prop-types
        isScreenSharing={props.isScreenSharing}
        // eslint-disable-next-line react/prop-types
        isMuted={props.isMuted}
        // @ts-expect-error - types issue
        ref={ref}
      />
    );
  }),
);
