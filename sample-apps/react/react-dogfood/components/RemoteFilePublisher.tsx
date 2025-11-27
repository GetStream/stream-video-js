import { createContext, useContext } from 'react';
import clsx from 'clsx';
import {
  Call,
  hasAudio,
  hasVideo,
  SfuModels,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export type RemoteFilePublisher = {
  publish: (...trackTypes: SfuModels.TrackType[]) => Promise<void>;
  unpublish: (...trackTypes: SfuModels.TrackType[]) => Promise<void>;
  videoElement: HTMLVideoElement;
};

export const RemoteFilePublisherContext = createContext<
  RemoteFilePublisher | undefined
>(undefined);

export const useRemoteFilePublisher = () => {
  return useContext(RemoteFilePublisherContext);
};

export const publishRemoteFile = async (
  call: Call,
  videoFileUrl: string,
): Promise<RemoteFilePublisher> => {
  const videoElement = document.createElement('video');
  videoElement.crossOrigin = 'anonymous';
  // videoElement.muted = true;
  videoElement.volume = 0.001; // otherwise, it doesn't work with puppeteer
  videoElement.autoplay = true;
  videoElement.loop = true;
  videoElement.src = videoFileUrl;

  await videoElement.play();

  await call.microphone.disable();
  await call.camera.disable();

  // @ts-expect-error - captureStream is not in the type definitions yet
  const stream: MediaStream = videoElement.captureStream();

  const publish = async (...trackTypes: SfuModels.TrackType[]) => {
    if (trackTypes.includes(SfuModels.TrackType.AUDIO)) {
      await call.publish(stream, SfuModels.TrackType.AUDIO);
    }
    if (trackTypes.includes(SfuModels.TrackType.VIDEO)) {
      await call.publish(stream, SfuModels.TrackType.VIDEO);
    }
  };

  const unpublish = async (...trackTypes: SfuModels.TrackType[]) => {
    await call.stopPublish(...trackTypes);
  };

  await call.join({ create: true });
  await publish(SfuModels.TrackType.AUDIO, SfuModels.TrackType.VIDEO);

  return { publish, unpublish, videoElement };
};

export const RemoteVideoControls = (props: { api: RemoteFilePublisher }) => {
  const { api } = props;
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const isPublishingVideo = localParticipant && hasVideo(localParticipant);
  const isPublishingAudio = localParticipant && hasAudio(localParticipant);
  return (
    <>
      <button
        data-testid="vf-video-toggle"
        type="button"
        className={clsx('rd__button', {
          'rd__button--primary': isPublishingVideo,
          'rd__button--secondary': !isPublishingVideo,
        })}
        onClick={async () => {
          if (isPublishingVideo) {
            await api.unpublish(SfuModels.TrackType.VIDEO);
          } else {
            await api.publish(SfuModels.TrackType.VIDEO);
          }
        }}
      >
        Video
      </button>
      <button
        data-testid="vf-audio-toggle"
        type="button"
        className={clsx('rd__button', {
          'rd__button--primary': isPublishingAudio,
          'rd__button--secondary': !isPublishingAudio,
        })}
        onClick={async () => {
          if (isPublishingAudio) {
            await api.unpublish(SfuModels.TrackType.AUDIO);
          } else {
            await api.publish(SfuModels.TrackType.AUDIO);
          }
        }}
      >
        Audio
      </button>
    </>
  );
};
