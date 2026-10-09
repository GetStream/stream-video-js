import { forwardRef } from 'react';
import { useI18n } from '../../i18n';
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
      <DeviceSelectorVideo
        title={t('deviceSettings.selectCamera.title', 'Select a Camera')}
      />
      <DeviceSelectorAudioInput
        title={t('deviceSettings.selectMic.title', 'Select a Mic')}
      />
      <DeviceSelectorAudioOutput
        title={t('deviceSettings.selectSpeakers.title', 'Select Speakers')}
      />
    </div>
  );
};

const ToggleDeviceSettingsMenuButton = forwardRef<
  HTMLButtonElement,
  ToggleMenuButtonProps
>(function ToggleDeviceSettingsMenuButtonRender({ menuShown }, ref) {
  const { t } = useI18n();
  return (
    <IconButton
      active={menuShown}
      size="sm"
      variant="secondary"
      className={clsx('str-video__device-settings__button', {
        'str-video__device-settings__button--active': menuShown,
      })}
      title={t('deviceSettings.toggleDeviceMenu.title', 'Toggle device menu')}
      icon="device-settings"
      ref={ref}
    />
  );
});
