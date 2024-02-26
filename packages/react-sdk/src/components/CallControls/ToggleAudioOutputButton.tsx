import { CompositeButton, IconButtonWithMenuProps } from '../Button';
import { useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../Icon';

export type ToggleAudioOutputButtonProps = Pick<
  IconButtonWithMenuProps,
  'caption' | 'Menu' | 'menuPlacement'
>;

export const ToggleAudioOutputButton = (
  props: ToggleAudioOutputButtonProps,
) => {
  const { t } = useI18n();
  const { caption, Menu } = props;

  return (
    <CompositeButton
      Menu={Menu}
      caption={caption}
      title={caption || t('Speakers')}
      data-testid="audio-output-button"
    >
      <Icon icon="speaker" />
    </CompositeButton>
  );
};
