import clsx from 'clsx';
import { ChangeEventHandler, useCallback } from 'react';

import { useDeviceList } from '../../hooks';
import { DropDownSelect, DropDownSelectOption } from '../DropdownSelect';
import { useMenuContext } from '../Menu';

type DeviceSelectorOptionProps = {
  id: string;
  label: string;
  name?: string;
  selected?: boolean;
  value: string;
  disabled?: boolean;
  defaultChecked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

const DeviceSelectorOption = ({
  disabled,
  id,
  label,
  onChange,
  name,
  selected,
  defaultChecked,
  value,
}: DeviceSelectorOptionProps) => {
  return (
    <label
      className={clsx('str-video__device-settings__option', {
        'str-video__device-settings__option--selected': selected,
        'str-video__device-settings__option--disabled': disabled,
      })}
      htmlFor={id}
    >
      <input
        type="radio"
        name={name}
        onChange={onChange}
        value={value}
        id={id}
        checked={selected}
        defaultChecked={defaultChecked}
        disabled={disabled}
      />
      {label}
    </label>
  );
};

export type DeviceSelectorType = 'audioinput' | 'audiooutput' | 'videoinput';

const DeviceSelectorList = (props: {
  devices: MediaDeviceInfo[];
  type: DeviceSelectorType;
  selectedDeviceId?: string;
  title?: string;
  onChange?: (deviceId: string) => void;
}) => {
  const { devices = [], selectedDeviceId, title, type, onChange } = props;
  const { close } = useMenuContext();
  const { deviceList } = useDeviceList(devices, selectedDeviceId);

  return (
    <div className="str-video__device-settings__device-kind">
      {title && (
        <div className="str-video__device-settings__device-selector-title">
          {title}
        </div>
      )}
      {deviceList.map((device) => {
        return (
          <DeviceSelectorOption
            id={`${type}--${device.deviceId}`}
            value={device.deviceId}
            label={device.label}
            key={device.deviceId}
            onChange={(e) => {
              const deviceId = e.target.value;
              if (deviceId !== 'default') {
                onChange?.(deviceId);
              }
              close?.();
            }}
            name={type}
            selected={device.isSelected}
          />
        );
      })}
    </div>
  );
};

const DeviceSelectorDropdown = (props: {
  devices: MediaDeviceInfo[];
  selectedDeviceId?: string;
  title?: string;
  onChange?: (deviceId: string) => void;
  icon: string;
}) => {
  const { devices = [], selectedDeviceId, title, onChange, icon } = props;
  const { deviceList, selectedDeviceInfo, selectedIndex } = useDeviceList(
    devices,
    selectedDeviceId,
  );

  const handleSelect = useCallback(
    (index: number) => {
      const deviceId = deviceList[index].deviceId;
      if (deviceId !== 'default') {
        onChange?.(deviceId);
      }
    },
    [deviceList, onChange],
  );

  return (
    <div className="str-video__device-settings__device-kind">
      <div className="str-video__device-settings__device-selector-title">
        {title}
      </div>
      <DropDownSelect
        icon={icon}
        defaultSelectedIndex={selectedIndex}
        defaultSelectedLabel={selectedDeviceInfo.label}
        handleSelect={handleSelect}
      >
        {deviceList.map((device) => (
          <DropDownSelectOption
            key={device.deviceId}
            icon={icon}
            label={device.label}
            selected={device.isSelected}
          />
        ))}
      </DropDownSelect>
    </div>
  );
};

export const DeviceSelector = (props: {
  devices: MediaDeviceInfo[];
  icon: string;
  type: DeviceSelectorType;
  selectedDeviceId?: string;
  title?: string;
  onChange?: (deviceId: string) => void;
  visualType?: 'list' | 'dropdown';
}) => {
  const { visualType = 'list', icon, ...rest } = props;

  if (visualType === 'list') {
    return <DeviceSelectorList {...rest} />;
  }
  return <DeviceSelectorDropdown {...rest} icon={icon} />;
};
