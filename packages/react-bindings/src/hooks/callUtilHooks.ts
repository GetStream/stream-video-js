import { useCallback, useEffect, useState } from 'react';
import { useCall } from '../contexts';
import { useIsCallRecordingInProgress } from './callStateHooks';
import { hasAudio, StreamVideoParticipant } from '@stream-io/video-client';

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
 * Custom hook for checking if an audio track is connecting.
 *
 * This hook checks if the participant has an audio track and if the audio track is unmuted.
 *
 * @param participant the participant to check.
 * @returns true if the audio track is connecting, false otherwise.
 */
export const useIsAudioConnecting = (participant: StreamVideoParticipant) => {
  const audioStream = participant.audioStream;
  const hasAudioTrack = hasAudio(participant);

  const [unmuted, setUnmuted] = useState(() => {
    const track = audioStream?.getAudioTracks()[0];
    return !!track && !track.muted;
  });

  useEffect(() => {
    const track = audioStream?.getAudioTracks()[0];
    if (!track) return;

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
  }, [audioStream]);

  return hasAudioTrack && !unmuted;
};
