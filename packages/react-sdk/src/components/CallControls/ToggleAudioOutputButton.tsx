import { CompositeButton, IconButton } from '../Button';
import { DeviceSelectorAudioOutput } from '../DeviceSettings';
import {
  useCall,
  useMasterAudioOutputLevel,
  useI18n,
} from '@stream-io/video-react-bindings';
import { ComponentType } from 'react';

export type ToggleAudioOutputButtonProps = {
  /**
   * The explanatory text displayed under the control button.
   */
  caption?: string;
  /**
   * A custom component to render the list of available audio output devices.
   */
  Menu?: ComponentType;
};

export const ToggleAudioOutputButton = (
  props: ToggleAudioOutputButtonProps,
) => {
  const call = useCall();
  const masterAudioOutputLevel = useMasterAudioOutputLevel();
  const { t } = useI18n();
  const { caption = t('Speakers'), Menu = DeviceSelectorAudioOutput } = props;
  const enabled = masterAudioOutputLevel > 0;

  return (
    <CompositeButton Menu={Menu} active={!enabled} caption={caption}>
      <IconButton
        icon={enabled ? 'speaker' : 'speaker-off'}
        onClick={() => call?.setAudioOutputLevel(enabled ? 0 : 1)}
      />
    </CompositeButton>
  );
};
