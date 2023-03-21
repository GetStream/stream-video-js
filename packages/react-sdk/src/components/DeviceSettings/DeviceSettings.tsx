import { forwardRef } from 'react';
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
    <MenuToggle ToggleButton={ToggleMenuButton}>
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
  ({ menuShown }, ref) => (
    <IconButton
      className={clsx('str-video__device-settings__button', {
        'str-video__device-settings__button--active': menuShown,
      })}
      title="Toggle device menu"
      icon="device-settings"
      ref={ref}
      // tabindex={0}
    />
  ),
);
