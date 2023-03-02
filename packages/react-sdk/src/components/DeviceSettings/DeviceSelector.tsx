import clsx from 'clsx';
import { ChangeEventHandler } from 'react';

type DeviceSelectorOptionProps = {
  id: string;
  label: string;
  name: string;
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
export const DeviceSelector = (props: {
  devices: MediaDeviceInfo[];
  selectedDeviceId?: string;
  title: string;
  onChange?: (deviceId: string) => void;
}) => {
  const {
    devices = [],
    selectedDeviceId: selectedDeviceFromProps,
    title,
    onChange,
  } = props;
  const inputGroupName = title.replace(' ', '-').toLowerCase();

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
      <div className="str-video__device-settings__device-selector-title">
        {title}
      </div>
      {!devices.length ? (
        <DeviceSelectorOption
          id={`${inputGroupName}--default`}
          label="Default"
          name={inputGroupName}
          defaultChecked
          value="default"
        />
      ) : (
        devices.map((device) => {
          return (
            <DeviceSelectorOption
              id={`${inputGroupName}--${device.deviceId}`}
              value={device.deviceId}
              label={device.label}
              key={device.deviceId}
              onChange={(e) => {
                onChange?.(e.target.value);
              }}
              name={inputGroupName}
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
