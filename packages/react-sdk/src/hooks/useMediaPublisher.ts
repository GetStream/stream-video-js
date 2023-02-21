import { useVideoPublisher, VideoPublisherInit } from './useVideoPublisher';
import { useAudioPublisher, AudioPublisherInit } from './useAudioPublisher';
import {
  AudioUpdateParams,
  useAudioOutputUpdate,
} from './useAudioOutputUpdate';

type MediaPublisherParams = AudioUpdateParams &
  VideoPublisherInit &
  AudioPublisherInit;

export const useMediaPublisher = ({
  call,
  initialAudioMuted,
  initialVideoMuted,
  videoDeviceId,
  audioDeviceId,
  audioOutputDeviceId,
}: MediaPublisherParams) => {
  useAudioOutputUpdate({ audioOutputDeviceId });
  const publishVideoStream = useVideoPublisher({
    call,
    initialVideoMuted,
    videoDeviceId,
  });
  const publishAudioStream = useAudioPublisher({
    call,
    initialAudioMuted,
    audioDeviceId,
  });
  return { publishAudioStream, publishVideoStream };
};
