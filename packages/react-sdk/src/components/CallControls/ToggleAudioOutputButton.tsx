import { CompositeButton, IconButton } from '../Button';
import { DeviceSelectorAudioOutput } from '../DeviceSettings';

export type ToggleAudioOutputButtonProps = { caption?: string };

export const ToggleAudioOutputButton = ({
  caption = 'Speakers',
}: ToggleAudioOutputButtonProps) => {
  return (
    <CompositeButton Menu={DeviceSelectorAudioOutput} enabled caption={caption}>
      <IconButton icon="speaker" />
    </CompositeButton>
  );
};
