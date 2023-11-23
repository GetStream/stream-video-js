import { CompositeButton, IconButton } from '../Button';
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
  const { caption, Menu } = props;

  return (
    <CompositeButton Menu={Menu} caption={caption}>
      <IconButton icon="speaker" title={caption || t('Speakers')} />
    </CompositeButton>
  );
};
