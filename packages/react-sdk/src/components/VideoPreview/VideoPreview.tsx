import { ComponentType, useEffect, useState } from 'react';
import clsx from 'clsx';
import { createSoundDetector } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../i18n';
import { BaseVideo } from '../../core/components/Video';
import { LoadingIndicator } from '../LoadingIndicator';

const DefaultDisabledVideoPreview = () => {
  const { t } = useI18n();
  return (
    <div className="str_video__video-preview__disabled-video-preview">
      {t('common.videoDisabled.text', 'Video is disabled')}
    </div>
  );
};

const DefaultNoCameraPreview = () => {
  const { t } = useI18n();
  return (
    <div className="str_video__video-preview__no-camera-preview">
      {t('common.noCameraFound.text', 'No camera found')}
    </div>
  );
};

/**
 * Reports whether the local user is currently speaking, before they join the
 * call. `MicrophoneManager` only runs its detector while the microphone is
 * muted (for `speakingWhileMuted`), so this mirrors `AudioVolumeIndicator` and
 * runs one on the live microphone stream instead.
 */
const useLocalSpeaking = (enabled: boolean) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isEnabled, mediaStream } = useMicrophoneState();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!enabled || !isEnabled || !mediaStream) {
      setIsSpeaking(false);
      return;
    }

    const dispose = createSoundDetector(
      mediaStream,
      ({ isSoundDetected }) => setIsSpeaking(isSoundDetected),
      { detectionFrequencyInMs: 80, destroyStreamOnStop: false },
    );

    return () => {
      setIsSpeaking(false);
      dispose().catch(console.error);
    };
  }, [enabled, isEnabled, mediaStream]);

  return isSpeaking;
};

export type VideoPreviewProps = {
  /**
   * Additional CSS class name to apply to the root element.
   */
  className?: string;
  /**
   * Enforces mirroring of the video on the X axis. Defaults to true.
   */
  mirror?: boolean;
  /**
   * Component rendered when user turns off the video.
   */
  DisabledVideoPreview?: ComponentType;
  /**
   * Component rendered when no camera devices are available.
   */
  NoCameraPreview?: ComponentType;
  /**
   * Component rendered above the BaseVideo until the video is ready (meaning until the play event is emitted).
   */
  StartingCameraPreview?: ComponentType;
  /**
   * Outlines the preview while the local user is speaking. Requires the
   * microphone to be enabled. Defaults to false.
   */
  speakingIndicatorVisible?: boolean;
};

export const VideoPreview = ({
  className,
  mirror = true,
  DisabledVideoPreview = DefaultDisabledVideoPreview,
  NoCameraPreview = DefaultNoCameraPreview,
  StartingCameraPreview = LoadingIndicator,
  speakingIndicatorVisible = false,
}: VideoPreviewProps) => {
  const { useCameraState } = useCallStateHooks();
  const { devices, status, isMute, mediaStream } = useCameraState();
  const isSpeaking = useLocalSpeaking(speakingIndicatorVisible);

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
    <div
      className={clsx('str-video__video-preview-container', className, {
        'str-video__video-preview-container--speaking': isSpeaking,
      })}
    >
      {contents}
    </div>
  );
};
