import { Call, SfuModels } from '@stream-io/video-react-sdk';

export const publishRemoteFile = async (call: Call, videoFileUrl: string) => {
  const videoElement = document.createElement('video');
  videoElement.crossOrigin = 'anonymous';
  videoElement.muted = true;
  videoElement.autoplay = true;
  videoElement.loop = true;
  videoElement.src = videoFileUrl;

  await videoElement.play();

  await call.microphone.disable();
  await call.camera.disable();
  await call.join({ create: true });

  // @ts-expect-error - captureStream is not in the type definitions yet
  const stream: MediaStream = videoElement.captureStream();
  await call.publish(stream, SfuModels.TrackType.AUDIO);
  await call.publish(stream, SfuModels.TrackType.VIDEO);
};
