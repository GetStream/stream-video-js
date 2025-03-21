import {
  CallingState,
  getLogger,
  hasScreenShare,
  speakerLayoutSortPreset,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import React, { useEffect, useMemo } from 'react';
import { findNodeHandle } from 'react-native';
import { onNativeCallClosed, RTCViewPipNative } from './RTCViewPipNative';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { shouldDisableIOSLocalVideoOnBackgroundRef } from '../../../utils/internal/shouldDisableIOSLocalVideoOnBackground';

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
      includeLocalParticipantVideo ? true : !participant.isLocalParticipant,
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
        onNativeCallClosed(node);
      }
      shouldDisableIOSLocalVideoOnBackgroundRef.current = true;
    };
    const unsubFunc = call?.on('call.ended', () => {
      getLogger(['RTCViewPipIOS'])(
        'debug',
        `onCallClosed due to call.ended event`,
      );
      unsubFunc?.();
      onCallClosed();
    });
    const subscription = call?.state.callingState$.subscribe((state) => {
      if (state === CallingState.LEFT || state === CallingState.IDLE) {
        getLogger(['RTCViewPipIOS'])(
          'debug',
          `onCallClosed due to callingState: ${state}`,
        );
        subscription?.unsubscribe();
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

  return <RTCViewPipNative streamURL={streamURL} ref={nativeRef} />;
});

RTCViewPipIOS.displayName = 'RTCViewPipIOS';

export default RTCViewPipIOS;
