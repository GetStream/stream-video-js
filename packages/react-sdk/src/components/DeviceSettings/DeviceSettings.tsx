import { forwardRef } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import { MenuToggle, ToggleMenuButtonProps } from '../Menu';
import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
} from './DeviceSelectorAudio';
import { DeviceSelectorVideo } from './DeviceSelectorVideo';
import { IconButton } from '../Button';
import clsx from 'clsx';

export const DeviceSettings = () => {
  return (
    <MenuToggle placement="bottom-end" ToggleButton={ToggleMenuButton}>
      <Menu />
    </MenuToggle>
  );
};

const Menu = () => (
  <div className="str-video__device-settings">
    <DeviceSelectorVideo />
    <DeviceSelectorAudioInput />
    <DeviceSelectorAudioOutput />
  </div>
);

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  ({ menuShown }, ref) => {
    const { t } = useI18n();

    return (
      <IconButton
        className={clsx('str-video__device-settings__button', {
          'str-video__device-settings__button--active': menuShown,
        })}
        title={t('Toggle device menu')}
        icon="device-settings"
        ref={ref}
        // tabindex={0}
      />
    );
  },
);
