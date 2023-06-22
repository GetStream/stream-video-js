import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts/StreamVideoContext';
import {
  isCameraPermissionGranted$,
  isMicPermissionGranted$,
} from '../utils/StreamVideoRN/permissions';
/**
 * A helper hook which exposes audio, video mute and camera facing mode and
 * their respective functions to toggle state
 *
 * @category Device Management
 */
export const useMutingState = () => {
  const isAudioMutedState = useStreamVideoStoreValue(
    (store) => store.isAudioMuted,
  );
  const isVideoMutedState = useStreamVideoStoreValue(
    (store) => store.isVideoMuted,
  );
  const setState = useStreamVideoStoreSetState();
  const isMicPermissionGranted = isMicPermissionGranted$.getValue();
  const isCameraPermissionGranted = isCameraPermissionGranted$.getValue();
  const toggleAudioState = () => {
    if (!isMicPermissionGranted) {
      console.warn('Microphone permission not granted');
      return;
    }
    setState({ isAudioMuted: !isAudioMuted });
  };
  const toggleVideoState = () => {
    if (!isCameraPermissionGranted) {
      console.warn('Camera permission not granted');
      return;
    }
    setState({ isVideoMuted: !isVideoMuted });
  };
  const isAudioMuted = isAudioMutedState || !isMicPermissionGranted;
  const isVideoMuted = isVideoMutedState || !isCameraPermissionGranted;

  return {
    isAudioMuted,
    isVideoMuted,
    toggleAudioState,
    toggleVideoState,
  };
};
