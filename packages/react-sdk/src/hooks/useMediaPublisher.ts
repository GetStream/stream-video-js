import { useVideoPublisher, VideoPublisherInit } from './useVideoPublisher';
import { useAudioPublisher, AudioPublisherInit } from './useAudioPublisher';

export const useMediaPublisher = ({
  call,
  initialAudioMuted,
  initialVideoMuted,
  videoDeviceId,
  audioDeviceId,
}: VideoPublisherInit & AudioPublisherInit) => {
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
