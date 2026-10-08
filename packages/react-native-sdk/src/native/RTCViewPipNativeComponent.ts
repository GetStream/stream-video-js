import type * as React from 'react';
import {
  codegenNativeCommands,
  codegenNativeComponent,
  type HostComponent,
  type ViewProps,
} from 'react-native';

import type {
  BubblingEventHandler,
  Double,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

type PiPChangeEvent = Readonly<{
  active: boolean;
}>;

type PiPBoundsChangeEvent = Readonly<{
  width: Double;
  height: Double;
}>;

export interface NativeProps extends ViewProps {
  streamURL?: string;
  mirror?: boolean;
  onPiPChange?: BubblingEventHandler<PiPChangeEvent>;
  onPiPBoundsChange?: BubblingEventHandler<PiPBoundsChangeEvent>;
  participantName?: string;
  participantImageURL?: string;
  isReconnecting?: boolean;
  isScreenSharing?: boolean;
  hasAudio?: WithDefault<boolean, true>;
  isTrackPaused?: boolean;
  isPinned?: boolean;
  isSpeaking?: boolean;
  connectionQuality?: Int32;
}

type ComponentType = HostComponent<NativeProps>;

interface NativeCommands {
  onCallClosed: (viewRef: React.ElementRef<ComponentType>) => void;
  setPreferredContentSize: (
    viewRef: React.ElementRef<ComponentType>,
    width: Double,
    height: Double,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['onCallClosed', 'setPreferredContentSize'],
});

// iOS-only: Android renders nothing for this view.
export default codegenNativeComponent<NativeProps>('RTCViewPip', {
  excludedPlatforms: ['android'],
}) as ComponentType;
