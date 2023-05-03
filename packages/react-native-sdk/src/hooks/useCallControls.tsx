import {
  CallingState,
  getAudioStream,
  getVideoStream,
  SfuModels,
} from '@stream-io/video-client';
import {
  useActiveCall,
  useCallCallingState,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import { useCallback, useEffect, useRef } from 'react';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts/StreamVideoContext';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { useAppStateListener } from '../utils/useAppStateListener';
import { Alert } from 'react-native';
import { useIsOnline } from './useIsOnline';

/**
 * A helper hook which exposes audio, video mute and camera facing mode and
 * their respective functions to toggle state
 *
 * @category Device Management
 */
export const useCallControls = () => {
  const localParticipant = useLocalParticipant();
  const call = useActiveCall();
  const setState = useStreamVideoStoreSetState();
  const isOnline = useIsOnline();
  const isCameraOnFrontFacingMode = useStreamVideoStoreValue(
    (store) => store.isCameraOnFrontFacingMode,
  );
  const {
    audioDevice,
    currentVideoDevice,
    videoDevices,
    setCurrentVideoDevice,
  } = useMediaDevices();

  const isAudioMuted = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoMuted = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const publishAudioStream = useCallback(async () => {
    try {
      // Client picks up the default audio stream.
      // For mobile devices there will always be one audio input
      if (audioDevice) {
        const audioStream = await getAudioStream(audioDevice.deviceId);
        if (call) {
          await call.publishAudioStream(audioStream);
        }
      }
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [audioDevice, call]);

  const publishVideoStream = useCallback(async () => {
    try {
      if (isOnline && currentVideoDevice) {
        const videoStream = await getVideoStream(currentVideoDevice.deviceId);
        if (call) {
          await call.publishVideoStream(videoStream);
        }
      }
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, currentVideoDevice, isOnline]);

  /** Refs to keep track of whether the user has published the track before going offline  */
  const isAudioPublishedRef = useRef(false);
  const isVideoPublishedRef = useRef(false);
  isAudioPublishedRef.current = !isAudioMuted;
  isVideoPublishedRef.current = !isVideoMuted;

  /** Refs to be used for useEffect that does the rejoining flow when coming back offline */
  const publishAudioStreamRef = useRef(publishAudioStream);
  const publishVideoStreamRef = useRef(publishVideoStream);
  publishAudioStreamRef.current = publishAudioStream;
  publishVideoStreamRef.current = publishVideoStream;

  /** Attempt to republish video stream when app comes back to foreground */
  useAppStateListener(
    isVideoPublishedRef.current ? publishVideoStream : undefined,
  );

  /**
   * Effect to re-join to an existing call happens in case the user comes back online
   */
  useEffect(() => {
    if (!call) return;
    if (isOnline) {
      // Note: while doing rejoining we unpublish the streams first
      // so we get the published info before calling rejoin
      const isAudioPublished = isAudioPublishedRef.current;
      const isVideoPublished = isVideoPublishedRef.current;
      if (call.state.callingState === CallingState.OFFLINE) {
        call
          .rejoin?.()
          .then(() => {
            if (isAudioPublished) {
              publishAudioStreamRef.current();
            }
            if (isVideoPublished) {
              publishVideoStreamRef.current();
            }
          })
          .catch(() => {
            call.state.setCallingState(CallingState.RECONNECTING_FAILED);
          });
      }
    } else {
      if (call.state.callingState !== CallingState.OFFLINE) {
        call.state.setCallingState(CallingState.OFFLINE);
      }
    }
  }, [call, isOnline]);

  const toggleVideoMuted = useCallback(async () => {
    if (isVideoMuted) {
      publishVideoStream();
    } else {
      await call?.stopPublish(SfuModels.TrackType.VIDEO);
    }
  }, [call, isVideoMuted, publishVideoStream]);

  const toggleAudioMuted = useCallback(async () => {
    if (isAudioMuted) {
      publishAudioStream();
    } else {
      await call?.stopPublish(SfuModels.TrackType.AUDIO);
    }
  }, [call, isAudioMuted, publishAudioStream]);

  const toggleCameraFacingMode = useCallback(() => {
    const videoDevice = videoDevices.find(
      (device) =>
        device.kind === 'videoinput' &&
        (!isCameraOnFrontFacingMode
          ? device.facing === 'front'
          : device.facing === 'environment'),
    );
    setCurrentVideoDevice(videoDevice);
    setState((prevState) => ({
      isCameraOnFrontFacingMode: !prevState.isCameraOnFrontFacingMode,
    }));
  }, [
    isCameraOnFrontFacingMode,
    setCurrentVideoDevice,
    videoDevices,
    setState,
  ]);

  return {
    isAudioMuted,
    isVideoMuted,
    isCameraOnFrontFacingMode,
    toggleAudioMuted,
    toggleVideoMuted,
    toggleCameraFacingMode,
  };
};
