import { CompositeButton, IconButtonWithMenuProps } from '../Button';
import { useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../Icon';
import { DeviceSelectorAudioOutput } from '../DeviceSettings';

export type ToggleAudioOutputButtonProps = Pick<
  IconButtonWithMenuProps,
  'caption' | 'Menu' | 'menuPlacement'
>;

export const ToggleAudioOutputButton = (
  props: ToggleAudioOutputButtonProps,
) => {
  const { t } = useI18n();
  const {
    caption,
    Menu = DeviceSelectorAudioOutput,
    menuPlacement = 'top',
  } = props;

  return (
    <CompositeButton
      Menu={Menu}
      menuPlacement={menuPlacement}
      caption={caption}
      title={caption || t('Speakers')}
      data-testid="audio-output-button"
    >
      <Icon icon="speaker" />
    </CompositeButton>
  );
};
