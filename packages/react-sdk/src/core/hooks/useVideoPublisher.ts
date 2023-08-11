import { useCallback, useEffect, useRef } from 'react';
import { map } from 'rxjs';
import {
  CallingState,
  getVideoStream,
  OwnCapability,
  SfuModels,
  VideoSettingsCameraFacingEnum,
  watchForAddedDefaultVideoDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useDebugPreferredVideoCodec } from '../../components/Debug/useIsDebugMode';
import { useHasBrowserPermissions } from './useDevices';

/**
 * @internal
 */
export type VideoPublisherInit = {
  initialVideoMuted?: boolean;
  videoDeviceId?: string;
};

/**
 * @internal
 * @category Device Management
 */
export const useVideoPublisher = ({
  initialVideoMuted,
  videoDeviceId,
}: VideoPublisherInit) => {
  const call = useCall();
  const {
    useCallState,
    useCallCallingState,
    useLocalParticipant,
    useCallMetadata,
  } = useCallStateHooks();
  const callState = useCallState();
  const callingState = useCallCallingState();
  const participant = useLocalParticipant();
  const hasBrowserPermissionVideoInput = useHasBrowserPermissions(
    'camera' as PermissionName,
  );
  const { localParticipant$ } = callState;

  const preferredCodec = useDebugPreferredVideoCodec();
  const isPublishingVideo = participant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const metadata = useCallMetadata();
  const videoSettings = metadata?.settings.video;
  const targetResolution = videoSettings?.target_resolution;
  const publishVideoStream = useCallback(async () => {
    if (!call) return;
    if (!call.permissionsContext.hasPermission(OwnCapability.SEND_VIDEO)) {
      throw new Error(`No permission to publish video`);
    }
    try {
      const videoStream = await getVideoStream({
        deviceId: videoDeviceId,
        width: targetResolution?.width,
        height: targetResolution?.height,
        facingMode: toFacingMode(videoSettings?.camera_facing),
      });
      await call.publishVideoStream(videoStream, { preferredCodec });
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [
    call,
    preferredCodec,
    targetResolution?.height,
    targetResolution?.width,
    videoDeviceId,
    videoSettings?.camera_facing,
  ]);

  const lastVideoDeviceId = useRef(videoDeviceId);
  useEffect(() => {
    if (
      callingState === CallingState.JOINED &&
      videoDeviceId !== lastVideoDeviceId.current
    ) {
      lastVideoDeviceId.current = videoDeviceId;
      publishVideoStream().catch((e) => {
        console.error('Failed to publish video stream', e);
      });
    }
  }, [publishVideoStream, videoDeviceId, callingState]);

  const initialPublishRun = useRef(false);
  useEffect(() => {
    if (
      callingState === CallingState.JOINED &&
      !initialPublishRun.current &&
      !initialVideoMuted
    ) {
      // automatic publishing should happen only when joining the call
      // from the lobby, and the video is not muted
      publishVideoStream().catch((e) => {
        console.error('Failed to publish video stream', e);
      });
      initialPublishRun.current = true;
    }
  }, [callingState, initialVideoMuted, publishVideoStream]);

  useEffect(() => {
    if (!localParticipant$ || !hasBrowserPermissionVideoInput) return;
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
  }, [hasBrowserPermissionVideoInput, localParticipant$, call]);

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
        const videoStream = await getVideoStream({
          deviceId: 'default',
        });
        await call.publishVideoStream(videoStream);
      },
    );

    const handleTrackEnded = async () => {
      if (selectedVideoDeviceId === videoDeviceId) {
        const videoStream = await getVideoStream({
          deviceId: videoDeviceId,
        });
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

const toFacingMode = (value: VideoSettingsCameraFacingEnum | undefined) => {
  switch (value) {
    case VideoSettingsCameraFacingEnum.FRONT:
      return 'user';
    case VideoSettingsCameraFacingEnum.BACK:
      return 'environment';
    default:
      return undefined;
  }
};
