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
        // @ts-expect-error - types issue
        ref={ref}
      />
    );
  }),
);
