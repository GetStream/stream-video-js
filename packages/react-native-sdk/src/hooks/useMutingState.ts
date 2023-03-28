import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts/StreamVideoContext';
/**
 * A helper hook which exposes audio, video mute and camera facing mode and
 * their respective functions to toggle state
 *
 * @category Device Management
 */
export const useMutingState = () => {
  const isAudioMuted = useStreamVideoStoreValue((store) => store.isAudioMuted);
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const setState = useStreamVideoStoreSetState();
  const toggleAudioState = () => setState({ isAudioMuted: !isAudioMuted });
  const toggleVideoState = () => setState({ isVideoMuted: !isVideoMuted });

  return {
    isAudioMuted,
    isVideoMuted,
    toggleAudioState,
    toggleVideoState,
  };
};
