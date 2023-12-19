import { forwardRef } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import clsx from 'clsx';
import { MenuToggle, MenuVisualType, ToggleMenuButtonProps } from '../Menu';
import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
} from './DeviceSelectorAudio';
import { DeviceSelectorVideo } from './DeviceSelectorVideo';
import { IconButton } from '../Button';

export type DeviceSettingsProps = {
  visualType?: MenuVisualType;
};

export const DeviceSettings = ({
  visualType = MenuVisualType.MENU,
}: DeviceSettingsProps) => {
  return (
    <MenuToggle
      placement="bottom-end"
      ToggleButton={ToggleDeviceSettingsMenuButton}
      visualType={visualType}
    >
      <Menu />
    </MenuToggle>
  );
};

const Menu = () => {
  const { t } = useI18n();
  return (
    <div className="str-video__device-settings">
      <DeviceSelectorVideo title={t('Select a Camera')} />
      <DeviceSelectorAudioInput title={t('Select a Mic')} />
      <DeviceSelectorAudioOutput title={t('Select Speakers')} />
    </div>
  );
};

const ToggleDeviceSettingsMenuButton = forwardRef<
  HTMLButtonElement,
  ToggleMenuButtonProps
>(({ menuShown }, ref) => {
  const { t } = useI18n();
  return (
    <IconButton
      className={clsx('str-video__device-settings__button', {
        'str-video__device-settings__button--active': menuShown,
      })}
      title={t('Toggle device menu')}
      icon="device-settings"
      ref={ref}
    />
  );
});
