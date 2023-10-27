import { ComponentType } from 'react';
import clsx from 'clsx';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { BaseVideo } from '../../core/components/Video';
import { LoadingIndicator } from '../LoadingIndicator';

const DefaultDisabledVideoPreview = () => {
  const { t } = useI18n();
  return <div>{t('Video is disabled')}</div>;
};

const DefaultNoCameraPreview = () => {
  const { t } = useI18n();
  return <div>{t('No camera found')}</div>;
};

export type VideoPreviewProps = {
  /**
   * Additional CSS class name to apply to the root element.
   */
  className?: string;

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
  className,
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

  return (
    <div className={clsx('str-video__video-preview-container', className)}>
      {contents}
    </div>
  );
};
