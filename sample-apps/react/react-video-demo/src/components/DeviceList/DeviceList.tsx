import { FC, useCallback, useEffect, useState } from 'react';
import classnames from 'classnames';
import styles from './DeviceList.module.css';

export type Props = {
  className?: string;
  selectedDeviceId?: string;
  title?: string;
  devices: {
    deviceId: string;
    groupId: string;
    kind: MediaDeviceKind;
    label: string;
  }[];
  selectDevice: (kind: Partial<MediaDeviceKind>, deviceId: string) => void;
};

export const DeviceList: FC<Props> = ({
  title,
  devices,
  className,
  selectedDeviceId,
  selectDevice,
}) => {
  const rootClassName = classnames(styles.root, className);

  const handleSelectDevice = useCallback(
    (kind: any, deviceId: string) => {
      selectDevice(kind, deviceId);
    },
    [selectDevice],
  );

  return (
    <div className={rootClassName}>
      {title ? <h3 className={styles.heading}>{title}</h3> : null}
      <ul className={styles.list}>
        {devices.map(({ kind, label, deviceId }, index: number) => {
          const deviceClassName = classnames(styles.device, {
            [styles.selectedDevice]:
              selectedDeviceId === deviceId || devices.length === 1,
          });

          return (
            <li key={index} className={deviceClassName}>
              <label
                className={styles.label}
                htmlFor={`${kind}-${index}`}
                onClick={() => handleSelectDevice(kind, deviceId)}
              >
                <input
                  id={`${kind}-${index}`}
                  className={styles.radioButton}
                  name={kind}
                  type="radio"
                  defaultChecked={
                    selectedDeviceId === deviceId || devices.length === 1
                  }
                  value={deviceId}
                />
                {label}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
