import { ComponentType } from 'react';
import clsx from 'clsx';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { BaseVideo } from '../../core/components/Video';
import { LoadingIndicator } from '../LoadingIndicator';

const DefaultDisabledVideoPreview = () => {
  return <div>Video is disabled</div>;
};

const DefaultNoCameraPreview = () => {
  return <div>No camera found</div>;
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
};

export const VideoPreview = ({
  mirror = true,
  DisabledVideoPreview = DefaultDisabledVideoPreview,
  NoCameraPreview = DefaultNoCameraPreview,
  StartingCameraPreview = LoadingIndicator,
}: VideoPreviewProps) => {
  const { useCameraState } = useCallStateHooks();
  const { devices, status, isMute, mediaStream } = useCameraState();

  let contents;
  if (isMute && devices?.length === 0) {
    contents = <NoCameraPreview />;
  } else if (status === 'enabled') {
    const loading = !mediaStream;
    contents = (
      <>
        {mediaStream && (
          <BaseVideo
            stream={mediaStream}
            className={clsx('str-video__video-preview', {
              'str-video__video-preview--mirror': mirror,
              'str-video__video-preview--loading': loading,
            })}
          />
        )}
        {loading && <StartingCameraPreview />}
      </>
    );
  } else {
    contents = <DisabledVideoPreview />;
  }

  return <div className="str-video__video-preview-container">{contents}</div>;
};
