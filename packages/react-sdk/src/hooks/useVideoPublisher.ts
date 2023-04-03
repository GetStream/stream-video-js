import {
  Call,
  disposeOfMediaStream,
  getVideoStream,
  SfuModels,
  watchForAddedDefaultVideoDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import { useCallback, useEffect, useRef } from 'react';
import { map } from 'rxjs';
import { useDebugPreferredVideoCodec } from '../components/Debug/useIsDebugMode';

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 *
 * */
export type VideoPublisherInit = {
  call?: Call;
  initialVideoMuted?: boolean;
  videoDeviceId?: string;
};

/**
 *
 * @param param0
 * @returns
 *
 * @category Device Management
 */
export const useVideoPublisher = ({
  call,
  initialVideoMuted,
  videoDeviceId,
}: VideoPublisherInit) => {
  // FIXME OL: cleanup
  // const { localParticipant$ } = useStore();
  const callState = call?.state;
  const { localParticipant$ } = callState || {};
  // helper reference to determine initial publishing of the media stream
  const initialPublishExecuted = useRef<boolean>(false);
  const participant = localParticipant$
    ? callState?.getCurrentValue(localParticipant$)
    : undefined;
  const preferredCodec = useDebugPreferredVideoCodec();
  const isPublishingVideo = participant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const publishVideoStream = useCallback(async () => {
    if (!call) return;
    try {
      const videoStream = await getVideoStream(videoDeviceId);
      await call.publishVideoStream(videoStream, { preferredCodec });
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, preferredCodec, videoDeviceId]);

  useEffect(() => {
    let interrupted = false;

    if (!call && initialPublishExecuted.current) {
      initialPublishExecuted.current = false;
    }

    if (
      !call ||
      // FIXME: remove "&& !initialPublishExecuted.current" and make
      // sure initialVideoMuted is not changing during active call
      (initialVideoMuted && !initialPublishExecuted.current) ||
      (!isPublishingVideo && initialPublishExecuted.current)
    ) {
      return;
    }

    getVideoStream(videoDeviceId).then((stream) => {
      if (interrupted) {
        return disposeOfMediaStream(stream);
      }

      initialPublishExecuted.current = true;
      return call.publishVideoStream(stream, { preferredCodec });
    });

    return () => {
      interrupted = true;
      call.stopPublish(SfuModels.TrackType.VIDEO);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoDeviceId, call, preferredCodec]);

  useEffect(() => {
    if (!localParticipant$) return;
    const subscription = watchForDisconnectedVideoDevice(
      localParticipant$.pipe(map((p) => p?.videoDeviceId)),
    ).subscribe(async () => {
      if (!call) return;
      call.setVideoDevice(undefined);
      await call.stopPublish(SfuModels.TrackType.VIDEO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  useEffect(() => {
    if (!participant?.videoStream || !call || !isPublishingVideo) return;

    const [track] = participant.videoStream.getVideoTracks();
    const selectedVideoDeviceId = track.getSettings().deviceId;

    const republishDefaultDevice = watchForAddedDefaultVideoDevice().subscribe(
      async () => {
        if (
          !(
            call &&
            participant.videoStream &&
            selectedVideoDeviceId === 'default'
          )
        )
          return;
        // We need to stop the original track first in order
        // we can retrieve the new default device stream
        track.stop();
        const videoStream = await getVideoStream('default');
        await call.publishVideoStream(videoStream);
      },
    );

    const handleTrackEnded = async () => {
      if (selectedVideoDeviceId === videoDeviceId) {
        const videoStream = await getVideoStream(videoDeviceId);
        await call.publishVideoStream(videoStream);
      }
    };

    track.addEventListener('ended', handleTrackEnded);
    return () => {
      track.removeEventListener('ended', handleTrackEnded);
      republishDefaultDevice.unsubscribe();
    };
  }, [videoDeviceId, call, participant?.videoStream, isPublishingVideo]);

  return publishVideoStream;
};
