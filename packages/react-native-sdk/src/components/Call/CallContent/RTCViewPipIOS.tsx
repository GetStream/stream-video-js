import {
  CallingState,
  hasScreenShare,
  speakerLayoutSortPreset,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import React, { useEffect, useMemo } from 'react';
import {
  findNodeHandle,
  HostComponent,
  Platform,
  requireNativeComponent,
  UIManager,
} from 'react-native';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { shouldDisableIOSLocalVideoOnBackgroundRef } from '../../../utils/internal/shouldDisableIOSLocalVideoOnBackground';

const COMPONENT_NAME = 'RTCViewPip';

type RTCViewPipNativeProps = {
  streamURL?: string;
};

const RTCViewPipNative: HostComponent<RTCViewPipNativeProps> =
  requireNativeComponent(COMPONENT_NAME);

/** Wrapper for the native view
 * meant to stay private and not exposed */
const RTCViewPip = React.memo(
  React.forwardRef<
    React.Ref<any>,
    {
      streamURL?: string;
    }
  >((props, ref) => {
    if (Platform.OS !== 'ios') return null;
    // @ts-ignore
    return <RTCViewPipNative streamURL={props.streamURL} ref={ref} />;
  })
);

type Props = {
  includeLocalParticipantVideo?: boolean;
};

const RTCViewPipIOS = React.memo(({ includeLocalParticipantVideo }: Props) => {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const _allParticipants = useParticipants({
    sortBy: speakerLayoutSortPreset,
  });
  const allParticipants = useDebouncedValue(_allParticipants, 300); // we debounce the participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously

  const [dominantSpeaker, dominantSpeaker2] = allParticipants.filter(
    (participant) =>
      includeLocalParticipantVideo ? true : !participant.isLocalParticipant
  );

  // show the dominant remote speaker in PiP mode
  // local speaker is shown only if remote doesn't exist
  let participantInSpotlight = dominantSpeaker;
  if (dominantSpeaker?.isLocalParticipant && dominantSpeaker2) {
    participantInSpotlight = dominantSpeaker2;
  }

  useEffect(() => {
    shouldDisableIOSLocalVideoOnBackgroundRef.current =
      !includeLocalParticipantVideo;
  }, [includeLocalParticipantVideo]);

  const nativeRef = React.useRef<any>(null);

  React.useEffect(() => {
    let callClosedInvokedOnce = false;
    const onCallClosed = () => {
      if (callClosedInvokedOnce) {
        return;
      }
      callClosedInvokedOnce = true;
      const node = findNodeHandle(nativeRef.current);
      if (node !== null) {
        UIManager.dispatchViewManagerCommand(
          node,
          // @ts-ignore
          UIManager.getViewManagerConfig(COMPONENT_NAME).Commands.onCallClosed,
          []
        );
      }
      shouldDisableIOSLocalVideoOnBackgroundRef.current = true;
    };
    const unsubFunc = call?.on('call.ended', () => {
      onCallClosed();
    });
    const subscription = call?.state.callingState$.subscribe((state) => {
      if (state === CallingState.LEFT || state === CallingState.IDLE) {
        onCallClosed();
      }
    });
    return () => {
      onCallClosed();
      unsubFunc?.();
      subscription?.unsubscribe();
    };
  }, [call]);

  const streamURL = useMemo(() => {
    if (!participantInSpotlight) {
      return undefined;
    }

    const { videoStream, screenShareStream } = participantInSpotlight;

    const isScreenSharing = hasScreenShare(participantInSpotlight);

    const videoStreamToRender = (isScreenSharing
      ? screenShareStream
      : videoStream) as unknown as MediaStream | undefined;

    return videoStreamToRender?.toURL();
  }, [participantInSpotlight]);

  return <RTCViewPip streamURL={streamURL} ref={nativeRef} />;
});

export default RTCViewPipIOS;
