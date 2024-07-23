import { CompositeButton, IconButtonWithMenuProps } from '../Button';
import { useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../Icon';
import { DeviceSelectorAudioOutput } from '../DeviceSettings';
import { WithTooltip } from '../Tooltip';
import { useState } from 'react';

export type ToggleAudioOutputButtonProps = Pick<
  IconButtonWithMenuProps,
  'caption' | 'Menu' | 'menuPlacement' | 'onMenuToggle'
>;

export const ToggleAudioOutputButton = (
  props: ToggleAudioOutputButtonProps,
) => {
  const { t } = useI18n();
  const {
    caption,
    Menu = DeviceSelectorAudioOutput,
    menuPlacement = 'top',
    onMenuToggle,
  } = props;
  const [tooltipDisabled, setTooltipDisabled] = useState(false);

  return (
    <WithTooltip
      title={caption || t('Speakers')}
      tooltipDisabled={tooltipDisabled}
    >
      <CompositeButton
        Menu={Menu}
        menuPlacement={menuPlacement}
        caption={caption}
        data-testid="audio-output-button"
        onMenuToggle={(shown) => {
          setTooltipDisabled(shown);
          onMenuToggle?.(shown);
        }}
      >
        <Icon icon="speaker" />
      </CompositeButton>
    </WithTooltip>
  );
};
