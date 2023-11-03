import { CompositeButton, IconButton } from '../Button';
import { DeviceSelectorAudioOutput } from '../DeviceSettings';
import { useI18n } from '@stream-io/video-react-bindings';
import { ComponentType } from 'react';

export type ToggleAudioOutputButtonProps = {
  caption?: string;
  Menu?: ComponentType;
};

export const ToggleAudioOutputButton = (
  props: ToggleAudioOutputButtonProps,
) => {
  const { t } = useI18n();
  const { caption = t('Speakers'), Menu = DeviceSelectorAudioOutput } = props;

  return (
    <CompositeButton Menu={Menu} caption={caption}>
      <IconButton icon="speaker" />
    </CompositeButton>
  );
};
