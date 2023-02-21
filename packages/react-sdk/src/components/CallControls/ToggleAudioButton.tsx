import { useCallback } from 'react';
import { SfuModels } from '@stream-io/video-client';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { IconButton } from '../Button/';
import { useMediaDevices } from '../../contexts';
import { DeviceSelectorAudio } from '../DeviceSettings';
import { CompositeButton } from '../Button';

export type ToggleAudioPreviewButtonProps = { caption?: string };

export const ToggleAudioPreviewButton = ({
  caption = 'Mic',
}: ToggleAudioPreviewButtonProps) => {
  const { initialAudioEnabled, toggleInitialAudio } = useMediaDevices();

  return (
    <CompositeButton
      Menu={DeviceSelectorAudio}
      enabled={!initialAudioEnabled}
      caption={caption}
    >
      <IconButton
        icon={initialAudioEnabled ? 'mic' : 'mic-off'}
        onClick={toggleInitialAudio}
      />
    </CompositeButton>
  );
};

export type ToggleAudioPublishingButtonProps = {
  caption?: string;
};

export const ToggleAudioPublishingButton = ({
  caption = 'Mic',
}: ToggleAudioPublishingButtonProps) => {
  const { publishAudioStream, stopPublishingAudio } = useMediaDevices();
  const localParticipant = useLocalParticipant();
  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const handleClick = useCallback(() => {
    if (isAudioMute) {
      void publishAudioStream();
    } else {
      stopPublishingAudio();
    }
  }, [isAudioMute, publishAudioStream, stopPublishingAudio]);

  return (
    <CompositeButton
      Menu={DeviceSelectorAudio}
      enabled={isAudioMute}
      caption={caption}
    >
      <IconButton
        icon={isAudioMute ? 'mic-off' : 'mic'}
        onClick={handleClick}
      />
    </CompositeButton>
  );
};
