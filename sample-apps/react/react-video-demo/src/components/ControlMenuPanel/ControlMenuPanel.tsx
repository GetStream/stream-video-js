import { FC } from 'react';

import SettingsMenu from '../SettingsMenu';
import DeviceList from '../DeviceList';

import { Settings } from '../Icons';

import styles from './ControlMenuPanel.module.css';

export type Props = {
  className?: string;
  selectedDeviceId?: string;
  devices: {
    deviceId: string;
    groupId: string;
    kind: MediaDeviceKind;
    label: string;
  }[];
  title: string;
  label: string;

  selectDevice(kind: Partial<MediaDeviceKind>, deviceId: string): void;
};

export const ControlMenuPanel: FC<Props> = ({
  devices,
  title,
  label,
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
      <div className={styles.footer}>
        <Settings className={styles.settings} />
        <p>{label}</p>
      </div>
    </SettingsMenu>
  );
};
