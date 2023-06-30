import {
  ComponentType,
  ReactEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react';
import clsx from 'clsx';
import { disposeOfMediaStream } from '@stream-io/video-client';
import { BaseVideo } from '../../core/components/Video';
import {
  DEVICE_STATE,
  useMediaDevices,
  useOnUnavailableVideoDevices,
  useVideoDevices,
} from '../../core';
import { LoadingIndicator } from '../LoadingIndicator';

const DefaultDisabledVideoPreview = () => {
  return <div>Video is disabled</div>;
};

const DefaultNoCameraPreview = () => {
  return <div>No camera found</div>;
};

type VideoErrorPreviewProps = {
  message?: string;
};
const DefaultVideoErrorPreview = ({ message }: VideoErrorPreviewProps) => {
  return (
    <>
      <div>Error:</div>
      <p>{message || 'Unexpected error happened'}</p>
    </>
  );
};

export type VideoPreviewProps = {
  /**
   * Component rendered when user turns off the video.
   */
  DisabledVideoPreview?: ComponentType;
  /**
   * Enforces mirroring of the video on the X axis. Defaults to true.
   */
  mirror?: boolean;
  /**
   * Component rendered when no camera devices are available.
   */
  NoCameraPreview?: ComponentType;
  /**
   * Component rendered above the BaseVideo until the video is ready (meaning until the play event is emitted).
   */
  StartingCameraPreview?: ComponentType;
  /**
   * Component rendered when the video stream could not be retrieved.
   */
  VideoErrorPreview?: ComponentType<VideoErrorPreviewProps>;
};

export const VideoPreview = ({
  mirror = true,
  DisabledVideoPreview = DefaultDisabledVideoPreview,
  NoCameraPreview = DefaultNoCameraPreview,
  StartingCameraPreview = LoadingIndicator,
  VideoErrorPreview = DefaultVideoErrorPreview,
}: VideoPreviewProps) => {
  const [stream, setStream] = useState<MediaStream>();
  const {
    selectedVideoDeviceId,
    getVideoStream,
    initialVideoState,
    setInitialVideoState,
  } = useMediaDevices();
  // When there are 0 video devices (e.g. when laptop lid closed),
  // we do not restart the video automatically when the device is again available,
  // but rather leave turning the video on manually to the user.
  useOnUnavailableVideoDevices(() =>
    setInitialVideoState(DEVICE_STATE.stopped),
  );
  const videoDevices = useVideoDevices();

  useEffect(() => {
    if (!initialVideoState.enabled) return;

    getVideoStream({ deviceId: selectedVideoDeviceId })
      .then((s) => {
        setStream((previousStream) => {
          if (previousStream) {
            disposeOfMediaStream(previousStream);
          }
          return s;
        });
      })
      .catch((e) =>
        setInitialVideoState({
          ...DEVICE_STATE.error,
          message: (e as Error).message,
        }),
      );
    return () => {
      setStream(undefined);
    };
  }, [
    initialVideoState,
    getVideoStream,
    selectedVideoDeviceId,
    setInitialVideoState,
    videoDevices.length,
  ]);

  useEffect(() => {
    if (initialVideoState.type === 'stopped') {
      setStream(undefined);
    }
  }, [initialVideoState]);

  const handleOnPlay: ReactEventHandler<HTMLVideoElement> = useCallback(() => {
    setInitialVideoState(DEVICE_STATE.playing);
  }, [setInitialVideoState]);

  let contents;
  if (initialVideoState.type === 'error') {
    contents = <VideoErrorPreview />;
  } else if (initialVideoState.type === 'stopped' && !videoDevices.length) {
    contents = <NoCameraPreview />;
  } else if (initialVideoState.enabled) {
    const loading = initialVideoState.type === 'starting';
    contents = (
      <>
        {stream && (
          <BaseVideo
            stream={stream}
            className={clsx('str-video__video-preview', {
              'str-video__video-preview--mirror': mirror,
              'str-video__video-preview--loading': loading,
            })}
            onPlay={handleOnPlay}
          />
        )}
        {loading && <StartingCameraPreview />}
      </>
    );
  } else {
    contents = <DisabledVideoPreview />;
  }

  return (
    <div className={clsx('str-video__video-preview-container')}>{contents}</div>
  );
};
