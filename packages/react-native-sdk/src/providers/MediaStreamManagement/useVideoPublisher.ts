import { useCallback, useEffect, useRef } from 'react';
import {
  CallingState,
  getVideoStream,
  OwnCapability,
  SfuModels,
} from '@stream-io/video-client';
import {
  useCall,
  useCallCallingState,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import { useStreamVideoStoreValue } from '../../contexts/StreamVideoContext';

/**
 * @internal
 */
export type VideoPublisherInit = {
  initialVideoMuted?: boolean;
};

/**
 * @internal
 * @category Device Management
 */
export const useVideoPublisher = ({
  initialVideoMuted,
}: VideoPublisherInit) => {
  const call = useCall();
  const callingState = useCallCallingState();
  const participant = useLocalParticipant();
  const videoDeviceId = useStreamVideoStoreValue(
    (store) => store.currentVideoDevice,
  )?.deviceId;

  const isPublishingVideo = participant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const publishVideoStream = useCallback(async () => {
    if (!call || !videoDeviceId) {
      return;
    }
    if (!call.permissionsContext.hasPermission(OwnCapability.SEND_VIDEO)) {
      throw new Error(
        "No permission from the call's admin to publish video stream",
      );
    }
    try {
      const videoStream = await getVideoStream({
        deviceId: videoDeviceId,
      });

      await call.publishVideoStream(videoStream);
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, videoDeviceId]);

  const initialPublishRun = useRef(false);

  /*
   * When joining the call, publish video stream automatically in the following case:
   * - joining the call from the lobby, and the video is not muted
   */
  useEffect(() => {
    if (callingState !== CallingState.JOINED) {
      return;
    }
    const shouldJoinInitially =
      !initialVideoMuted && !initialPublishRun.current;
    if (!shouldJoinInitially) {
      return;
    }
    publishVideoStream().catch((e) => {
      console.error('Failed to publish video stream', e);
    });
    initialPublishRun.current = true;
  }, [callingState, initialVideoMuted, publishVideoStream]);

  /*
   * When track ended unexpectedly due to unknown external factors, try to publish the video stream again
   * Note: this is not triggered when track.stop is called
   */
  useEffect(() => {
    if (!participant?.videoStream || !call || !isPublishingVideo) {
      return;
    }

    const [track] = participant.videoStream.getVideoTracks();
    const selectedVideoDeviceId = track.getSettings().deviceId;

    const handleTrackEnded = async () => {
      if (
        selectedVideoDeviceId === videoDeviceId &&
        call.permissionsContext.hasPermission(OwnCapability.SEND_VIDEO)
      ) {
        const videoStream = await getVideoStream({
          deviceId: videoDeviceId,
        });
        await call.publishVideoStream(videoStream);
      }
    };

    track.addEventListener('ended', handleTrackEnded);
    return () => {
      track.removeEventListener('ended', handleTrackEnded);
    };
  }, [videoDeviceId, call, participant?.videoStream, isPublishingVideo]);

  return publishVideoStream;
};
