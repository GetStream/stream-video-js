import { FC } from 'react';

import SettingsMenu from '../SettingsMenu';
import DeviceList from '../DeviceList';

export type Props = {
  className?: string;
  selectedDeviceId?: string;
  devices: MediaDeviceInfo[];
  title: string;

  selectDevice(deviceId: string): void;
};

export const ControlMenuPanel: FC<Props> = ({
  devices,
  title,
  className,
  selectedDeviceId,
  selectDevice,
}) => {
  return (
    <SettingsMenu className={className} title={title}>
      <DeviceList
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        selectDevice={selectDevice}
      />
    </SettingsMenu>
  );
};
