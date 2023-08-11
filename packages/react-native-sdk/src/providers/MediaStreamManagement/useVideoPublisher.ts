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
import { useAppStateListener } from '../../utils/hooks';

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

  /** Attempt to republish video stream when app comes back to foreground */
  useAppStateListener(() => {
    if (isPublishingVideo) {
      publishVideoStream();
    }
  }, undefined);

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

  return publishVideoStream;
};
