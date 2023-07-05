import { Call, CallingState, SfuModels } from '@stream-io/video-client';
import { useCall, useLocalParticipant } from '@stream-io/video-react-bindings';
import { useCallback, useEffect, useRef } from 'react';
import { useAppStateListener } from '../utils/hooks/useAppStateListener';
import NetInfo from '@react-native-community/netinfo';
import { useMediaStreamManagement } from '../providers/MediaStreamManagement';

/**
 * A helper hook which exposes audio, video mute and camera facing mode and
 * their respective functions to toggle state
 *
 * @category Device Management
 */
export const useCallControls = () => {
  const localParticipant = useLocalParticipant();
  const call = useCall();
  /** Refs to keep track of the current call and whether the user is online or not */
  const callRef = useRef(call);
  callRef.current = call;
  const isOnlineRef = useRef(true);

  const {
    publishAudioStream,
    publishVideoStream,
    stopPublishingAudio,
    stopPublishingVideo,
  } = useMediaStreamManagement();

  const isAudioPublished = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isVideoPublished = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  /** Refs to keep track of whether the user has published the track before going offline  */
  const isAudioPublishedRef = useRef(false);
  const isVideoPublishedRef = useRef(false);
  isAudioPublishedRef.current = !isAudioPublished;
  isVideoPublishedRef.current = !isVideoPublished;

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
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const { isConnected, isInternetReachable } = state;
      const isOnline = isConnected !== false && isInternetReachable !== false;
      isOnlineRef.current = isOnline;
      if (!callRef.current) {
        return;
      }
      const callToJoin = callRef.current;
      await rejoinCall(
        callToJoin,
        isOnline,
        isAudioPublishedRef.current,
        isVideoPublishedRef.current,
        publishAudioStreamRef.current,
        publishVideoStreamRef.current,
      );
    });

    return unsubscribe;
  }, []);

  const toggleVideoMuted = useCallback(async () => {
    if (!isVideoPublished) {
      publishVideoStream();
    } else {
      stopPublishingVideo();
    }
  }, [isVideoPublished, publishVideoStream, stopPublishingVideo]);

  const toggleAudioMuted = useCallback(async () => {
    if (!isAudioPublished) {
      publishAudioStream();
    } else {
      stopPublishingAudio();
    }
  }, [isAudioPublished, publishAudioStream, stopPublishingAudio]);

  return {
    isAudioPublished,
    isVideoPublished,
    toggleAudioMuted,
    toggleVideoMuted,
  };
};

/**
 * Helper function to rejoin a call and then publish the streams
 */
async function rejoinCall(
  callToJoin: Call,
  isOnline: boolean,
  isAudioPublished: boolean,
  isVideoPublished: boolean,
  publishAudioStream: () => Promise<void>,
  publishVideoStream: () => Promise<void>,
) {
  const isCurrentStateOffline =
    callToJoin.state.callingState === CallingState.OFFLINE;
  if (!isOnline && !isCurrentStateOffline) {
    callToJoin.state.setCallingState(CallingState.OFFLINE);
  } else if (isOnline && isCurrentStateOffline && callToJoin.rejoin) {
    try {
      await callToJoin.rejoin();
      if (isAudioPublished) {
        await publishAudioStream();
      }
      if (isVideoPublished) {
        await publishVideoStream();
      }
    } catch (e) {
      console.error('Failed to rejoin', e);
      callToJoin.state.setCallingState(CallingState.RECONNECTING_FAILED);
    }
  }
}
