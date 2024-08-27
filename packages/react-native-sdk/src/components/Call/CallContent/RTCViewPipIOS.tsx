import {
  CallingState,
  hasScreenShare,
  speakerLayoutSortPreset,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import React, { useEffect } from 'react';
import {
  findNodeHandle,
  Platform,
  requireNativeComponent,
  UIManager,
} from 'react-native';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { shouldDisableIOSLocalVideoOnBackgroundRef } from '../../../utils/internal/shouldDisableIOSLocalVideoOnBackground';

const COMPONENT_NAME = 'RTCViewPip';
const RTCViewPipNative = requireNativeComponent(COMPONENT_NAME);

/** Wrapper for the native view
 * meant to stay private and not exposed */
const RTCViewPip = React.forwardRef<
  React.Ref<any>,
  {
    streamURL?: string;
  }
>((props, ref) => {
  if (Platform.OS !== 'ios') return null;
  // @ts-ignore
  return <RTCViewPipNative streamURL={props.streamURL} ref={ref} />;
});

type Props = {
  includeLocalParticipantVideo?: boolean;
};

const RTCViewPipIOS = ({ includeLocalParticipantVideo }: Props) => {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const _allParticipants = useParticipants({
    sortBy: speakerLayoutSortPreset,
  });
  const allParticipants = useDebouncedValue(_allParticipants, 300); // we debounce the participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously

  const [participantInSpotlight] = allParticipants.filter((participant) =>
    includeLocalParticipantVideo ? true : !participant.isLocalParticipant
  );

  useEffect(() => {
    shouldDisableIOSLocalVideoOnBackgroundRef.current =
      !includeLocalParticipantVideo;
  }, [includeLocalParticipantVideo]);

  const [videoStreamToRender, setVideoStreamToRender] =
    React.useState<MediaStream>();

  const nativeRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!participantInSpotlight) {
      setVideoStreamToRender(undefined);
      return;
    }
    const { videoStream, screenShareStream } = participantInSpotlight;

    const isScreenSharing = hasScreenShare(participantInSpotlight);

    const _videoStreamToRender = (isScreenSharing
      ? screenShareStream
      : videoStream) as unknown as MediaStream | undefined;

    setVideoStreamToRender(_videoStreamToRender);
  }, [participantInSpotlight]);

  React.useEffect(() => {
    let callClosedInvokedOnce = false;
    const onCallClosed = () => {
      if (callClosedInvokedOnce) {
        return;
      }
      callClosedInvokedOnce = true;
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(nativeRef.current),
        // @ts-ignore
        UIManager.getViewManagerConfig(COMPONENT_NAME).Commands.onCallClosed,
        []
      );
      shouldDisableIOSLocalVideoOnBackgroundRef.current = false;
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

  return (
    <RTCViewPip streamURL={videoStreamToRender?.toURL()} ref={nativeRef} />
  );
};

export default RTCViewPipIOS;
