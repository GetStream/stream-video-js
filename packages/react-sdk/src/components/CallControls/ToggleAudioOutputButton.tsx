import { CompositeButton, IconButton } from '../Button';
import { DeviceSelectorAudioOutput } from '../DeviceSettings';
import {
  useCall,
  useDefaultAudioOutputLevel,
  useI18n,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import { ComponentType } from 'react';

export type ToggleAudioOutputButtonProps = {
  caption?: string;
  Menu?: ComponentType;
};

export const ToggleAudioOutputButton = (
  props: ToggleAudioOutputButtonProps,
) => {
  const call = useCall();
  const defaultAudioOutputLevel = useDefaultAudioOutputLevel();
  const localParticipant = useLocalParticipant();
  const { t } = useI18n();
  const { caption = t('Speakers'), Menu = DeviceSelectorAudioOutput } = props;
  const enabled =
    (localParticipant?.audioOutputLevel ?? defaultAudioOutputLevel) > 0;

  return (
    <CompositeButton Menu={Menu} active={!enabled} caption={caption}>
      <IconButton
        icon={enabled ? 'speaker' : 'speaker-off'}
        onClick={() => call?.setAudioOutputLevel(enabled ? 0 : 1)}
      />
    </CompositeButton>
  );
};
