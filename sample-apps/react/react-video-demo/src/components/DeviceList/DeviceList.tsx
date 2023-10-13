import { FC, useCallback } from 'react';
import classnames from 'classnames';
import styles from './DeviceList.module.css';
import { OptionsList, OptionsListItem } from '../SettingsMenu/SettingsMenu';

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
    (kind: MediaDeviceKind, deviceId: string) => {
      selectDevice(kind, deviceId);
    },
    [selectDevice],
  );

  return (
    <div className={rootClassName}>
      {title ? <h3 className={styles.heading}>{title}</h3> : null}
      <OptionsList>
        {devices.map(({ kind, label, deviceId }) => {
          const isSelected =
            selectedDeviceId === deviceId || devices.length === 1;
          return (
            <OptionsListItem
              key={deviceId}
              id={`${kind}-${deviceId}`}
              onClick={() => handleSelectDevice(kind, deviceId)}
              label={label}
              checked={isSelected}
              defaultChecked={isSelected}
              name={kind}
              value={deviceId}
            />
          );
        })}
      </OptionsList>
    </div>
  );
};
