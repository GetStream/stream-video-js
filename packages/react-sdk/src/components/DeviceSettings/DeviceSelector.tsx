import clsx from 'clsx';
import { ChangeEventHandler, useCallback } from 'react';

import { DropDownSelect, DropDownSelectOption } from '../DropdownSelect';

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
  const {
    devices = [],
    selectedDeviceId: selectedDeviceFromProps,
    title,
    type,
    onChange,
  } = props;

  // sometimes the browser (Chrome) will report the system-default device
  // with an id of 'default'. In case when it doesn't, we'll select the first
  // available device.
  let selectedDeviceId = selectedDeviceFromProps;
  if (
    devices.length > 0 &&
    !devices.find((d) => d.deviceId === selectedDeviceId)
  ) {
    selectedDeviceId = devices[0].deviceId;
  }

  return (
    <div className="str-video__device-settings__device-kind">
      {title && (
        <div className="str-video__device-settings__device-selector-title">
          {title}
        </div>
      )}
      {!devices.length ? (
        <DeviceSelectorOption
          id={`${type}--default`}
          label="Default"
          name={type}
          defaultChecked
          value="default"
        />
      ) : (
        devices.map((device) => {
          return (
            <DeviceSelectorOption
              id={`${type}--${device.deviceId}`}
              value={device.deviceId}
              label={device.label}
              key={device.deviceId}
              onChange={(e) => {
                onChange?.(e.target.value);
              }}
              name={type}
              selected={
                device.deviceId === selectedDeviceId || devices.length === 1
              }
            />
          );
        })
      )}
    </div>
  );
};

const DeviceSelectorDropdown = (props: {
  devices: MediaDeviceInfo[];
  selectedDeviceId?: string;
  title?: string;
  onChange?: (deviceId: string) => void;
  visualType?: 'list' | 'dropdown';
  icon: string;
  placeholder?: string;
}) => {
  const {
    devices = [],
    selectedDeviceId: selectedDeviceFromProps,
    title,
    onChange,
    icon,
  } = props;

  // sometimes the browser (Chrome) will report the system-default device
  // with an id of 'default'. In case when it doesn't, we'll select the first
  // available device.
  let selectedDeviceId = selectedDeviceFromProps;
  if (
    devices.length > 0 &&
    !devices.find((d) => d.deviceId === selectedDeviceId)
  ) {
    selectedDeviceId = devices[0].deviceId;
  }

  const selectedIndex = devices.findIndex(
    (d) => d.deviceId === selectedDeviceId,
  );

  const handleSelect = useCallback(
    (index: number) => {
      onChange?.(devices[index].deviceId);
    },
    [devices, onChange],
  );

  return (
    <div className="str-video__device-settings__device-kind">
      <div className="str-video__device-settings__device-selector-title">
        {title}
      </div>
      <DropDownSelect
        icon={icon}
        defaultSelectedIndex={selectedIndex}
        defaultSelectedLabel={devices[selectedIndex]?.label}
        handleSelect={handleSelect}
      >
        {devices.map((device) => {
          return (
            <DropDownSelectOption
              key={device.deviceId}
              icon={icon}
              label={device.label}
              selected={
                device.deviceId === selectedDeviceId || devices.length === 1
              }
            />
          );
        })}
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
  placeholder?: string;
}) => {
  const { visualType = 'list', icon, placeholder, ...rest } = props;

  if (visualType === 'list') {
    return <DeviceSelectorList {...rest} />;
  }
  return (
    <DeviceSelectorDropdown {...rest} icon={icon} placeholder={placeholder} />
  );
};
