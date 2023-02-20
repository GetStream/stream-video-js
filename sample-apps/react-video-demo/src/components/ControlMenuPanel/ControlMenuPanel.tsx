import { FC } from 'react';
import classnames from 'classnames';

import SettingsMenu from '../SettingsMenu';

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

  selectDevice: (kind: Partial<MediaDeviceKind>, deviceId: string) => void;
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
      <ul className={styles.deviceList}>
        {devices.map(({ kind, label, deviceId }) => {
          const deviceClassName = classnames(styles.device, {
            [styles.selectedDevice]: selectedDeviceId === deviceId,
          });

          return (
            <li
              className={deviceClassName}
              onClick={() => selectDevice(kind, deviceId)}
            >
              <label className={styles.label} htmlFor={deviceId}>
                <input
                  id={kind}
                  className={styles.radioButton}
                  name={deviceId}
                  type="radio"
                  checked={selectedDeviceId === deviceId}
                  value={deviceId}
                />
                {label}
              </label>
            </li>
          );
        })}
      </ul>
      <div className={styles.footer}>
        <Settings />
        <p>{label}</p>
      </div>
    </SettingsMenu>
  );
};
