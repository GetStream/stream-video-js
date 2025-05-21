import { getLogger } from '@stream-io/video-client';
import React from 'react';
import {
  type HostComponent,
  Platform,
  requireNativeComponent,
  StyleSheet,
  UIManager,
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
    UIManager.getViewManagerConfig(COMPONENT_NAME).Commands.onCallClosed,
    [],
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
        // eslint-disable-next-line react/prop-types
        streamURL={props.streamURL}
        // @ts-expect-error - types issue
        ref={ref}
      />
    );
  }),
);
