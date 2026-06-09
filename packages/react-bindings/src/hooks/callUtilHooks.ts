import { useCallback, useEffect, useState } from 'react';
import { useCall } from '../contexts';
import { useIsCallRecordingInProgress } from './callStateHooks';
import {
  hasAudio,
  hasVideo,
  StreamVideoParticipant,
} from '@stream-io/video-client';

/**
 * Custom hook for toggling call recording in a video call.
 *
 * This hook provides functionality to start and stop call recording,
 * along with state management for tracking the recording status
 * and the loading indicator while awaiting a response.
 */
export const useToggleCallRecording = () => {
  const call = useCall();
  const isCallRecordingInProgress = useIsCallRecordingInProgress();
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);

  // TODO: add permissions

  useEffect(() => {
    // we wait until call.recording_started/stopped event to flips the
    // `isCallRecordingInProgress` state variable.
    // Once the flip happens, we remove the loading indicator
    setIsAwaitingResponse((isAwaiting) => {
      if (isAwaiting) return false;
      return isAwaiting;
    });
  }, [isCallRecordingInProgress]);

  const toggleCallRecording = useCallback(async () => {
    try {
      setIsAwaitingResponse(true);
      if (isCallRecordingInProgress) {
        await call?.stopRecording();
      } else {
        await call?.startRecording();
      }
    } catch (e) {
      setIsAwaitingResponse(false);
      throw e;
    }
  }, [call, isCallRecordingInProgress]);

  return { toggleCallRecording, isAwaitingResponse, isCallRecordingInProgress };
};

/**
 * Internal hook that reports whether a published track is still connecting.
 *
 * A track is considered "connecting" when the participant has published it but
 * the underlying MediaStreamTrack is still muted (the SFU has signalled the
 * track but no media has arrived yet). It flips to `false` once the track fires
 * its `unmute` event (first frame/buffer received).
 */
const useIsTrackConnecting = (
  stream: MediaStream | undefined,
  hasTrack: boolean,
): boolean => {
  const trackId = stream?.getTracks()[0]?.id;

  const [unmuted, setUnmuted] = useState(() => {
    const track = stream?.getTracks()[0];
    return !!track && !track.muted;
  });

  useEffect(() => {
    const track = stream?.getTracks()[0];
    if (!track) {
      setUnmuted(false);
      return;
    }

    setUnmuted(!track.muted);

    const handler = () => {
      setUnmuted(!track.muted);
    };

    track.addEventListener('mute', handler);
    track.addEventListener('unmute', handler);

    return () => {
      track.removeEventListener('mute', handler);
      track.removeEventListener('unmute', handler);
    };
  }, [stream, trackId]);

  return hasTrack && !unmuted;
};

/**
 * Custom hook for checking if an audio track is connecting.
 *
 * This hook checks if the participant has an audio track and if the audio track is unmuted.
 *
 * @param participant the participant to check.
 * @returns true if the audio track is connecting, false otherwise.
 */
export const useIsAudioConnecting = (
  participant: StreamVideoParticipant,
): boolean => {
  return useIsTrackConnecting(participant.audioStream, hasAudio(participant));
};

/**
 * Custom hook for checking if a video track is connecting.
 *
 * This hook checks if the participant has a video track and if the video track is unmuted.
 *
 * @param participant the participant to check.
 * @returns true if the video track is connecting, false otherwise.
 */
export const useIsVideoConnecting = (
  participant: StreamVideoParticipant,
): boolean => {
  return useIsTrackConnecting(participant.videoStream, hasVideo(participant));
};
