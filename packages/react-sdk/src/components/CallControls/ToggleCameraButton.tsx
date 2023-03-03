import { MouseEventHandler, useCallback } from 'react';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { SfuModels } from '@stream-io/video-client';
import { IconButton } from '../Button/';
import { useMediaDevices } from '../../contexts';
import { CompositeButton } from '../Button';
import { DeviceSelectorVideo } from '../DeviceSettings';

export type ToggleCameraPreviewButtonProps = { caption?: string };

export const ToggleCameraPreviewButton = ({
  caption = 'Video',
}: ToggleCameraPreviewButtonProps) => {
  const { toggleVideoMuteState, initialVideoState } = useMediaDevices();

  return (
    <CompositeButton
      Menu={DeviceSelectorVideo}
      enabled={!initialVideoState.enabled}
      caption={caption}
    >
      <IconButton
        icon={initialVideoState.enabled ? 'camera' : 'camera-off'}
        onClick={toggleVideoMuteState}
      />
    </CompositeButton>
  );
};

type ToggleCameraPublishingButtonProps = {
  caption?: string;
};

export const ToggleCameraPublishingButton = ({
  caption = 'Video',
}: ToggleCameraPublishingButtonProps) => {
  const { publishVideoStream, stopPublishingVideo } = useMediaDevices();
  const localParticipant = useLocalParticipant();
  const isVideoMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (isVideoMute) {
      void publishVideoStream();
    } else {
      stopPublishingVideo();
    }
  }, [isVideoMute, publishVideoStream, stopPublishingVideo]);

  return (
    <CompositeButton
      Menu={DeviceSelectorVideo}
      enabled={isVideoMute}
      caption={caption}
    >
      <IconButton
        icon={isVideoMute ? 'camera-off' : 'camera'}
        onClick={handleClick}
      />
    </CompositeButton>
  );
};
