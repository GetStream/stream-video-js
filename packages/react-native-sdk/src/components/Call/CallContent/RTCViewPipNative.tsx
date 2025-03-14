import { getLogger } from '@stream-io/video-client';
import React from 'react';
import {
  type HostComponent,
  Platform,
  requireNativeComponent,
  UIManager,
  StyleSheet,
} from 'react-native';

const COMPONENT_NAME = 'RTCViewPip';

type RTCViewPipNativeProps = {
  streamURL?: string;
};

const NativeComponent: HostComponent<RTCViewPipNativeProps> =
  requireNativeComponent(COMPONENT_NAME);

export function onNativeCallClosed(reactTag: number) {
  getLogger(['RTCViewPipNative'])('debug', 'onNativeCallClosed');
  UIManager.dispatchViewManagerCommand(
    reactTag,
    // @ts-ignore
    UIManager.getViewManagerConfig(COMPONENT_NAME).Commands.onCallClosed,
    []
  );
}

/** Wrapper for the native view
 * meant to stay private and not exposed */
export const RTCViewPipNative = React.memo(
  React.forwardRef<
    React.Ref<any>,
    {
      streamURL?: string;
    }
  >((props, ref) => {
    if (Platform.OS !== 'ios') return null;

    return (
      <NativeComponent
        style={StyleSheet.absoluteFill}
        pointerEvents={'none'}
        streamURL={props.streamURL}
        // @ts-ignore
        ref={ref}
      />
    );
  })
);
