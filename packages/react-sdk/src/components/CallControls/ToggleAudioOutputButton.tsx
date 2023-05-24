import { CompositeButton, IconButton } from '../Button';
import { DeviceSelectorAudioOutput } from '../DeviceSettings';
import { useI18n } from '@stream-io/video-react-bindings';

export type ToggleAudioOutputButtonProps = { caption?: string };

export const ToggleAudioOutputButton = ({
  caption,
}: ToggleAudioOutputButtonProps) => {
  const { t } = useI18n();

  return (
    <CompositeButton
      Menu={DeviceSelectorAudioOutput}
      active
      caption={caption || t('Speakers')}
    >
      <IconButton icon="speaker" />
    </CompositeButton>
  );
};
