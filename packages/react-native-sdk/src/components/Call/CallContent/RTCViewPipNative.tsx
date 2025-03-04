import { getLogger } from '@stream-io/video-client';
import React from 'react';
import {
  type HostComponent,
  Platform,
  requireNativeComponent,
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
    // @ts-ignore
    return <NativeComponent streamURL={props.streamURL} ref={ref} />;
  })
);
