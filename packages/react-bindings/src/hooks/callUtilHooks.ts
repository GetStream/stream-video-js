import { useCallback, useEffect, useState } from 'react';
import { useCall } from '../contexts';
import { useIsCallRecordingInProgress } from './callStateHooks';

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
      console.error(`Failed start recording`, e);
      throw e;
    }
  }, [call, isCallRecordingInProgress]);

  return { toggleCallRecording, isAwaitingResponse, isCallRecordingInProgress };
};
