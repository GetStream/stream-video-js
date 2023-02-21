import clsx from 'clsx';
import { ChangeEventHandler, useCallback } from 'react';

type DeviceSelectorOptionProps = {
  id: string;
  label: string;
  name: string;
  selected: boolean;
  value: string;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};
const DeviceSelectorOption = ({
  disabled,
  id,
  label,
  onChange,
  name,
  selected,
  value,
}: DeviceSelectorOptionProps) => {
  return (
    <label
      className={clsx('str-video__device-settings__option', {
        'str-video__device-settings__option--selected': selected,
        'str-video__device-settings__option--disabled': disabled,
      })}
    >
      <input
        type="radio"
        name={name}
        onChange={onChange}
        value={value}
        id={id}
        checked={selected}
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
  const { devices, selectedDeviceId, title, onChange } = props;
  const inputGroupName = title.replace(' ', '-').toLowerCase();

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      onChange?.(e.target.value);
    },
    [onChange],
  );

  return (
    <div className="str-video__device-settings__device-kind">
      <div className="str-video__device-settings__device-selector-title">
        {title}
      </div>
      {!devices.length ? (
        <DeviceSelectorOption
          id="default"
          label="Default"
          name={inputGroupName}
          selected
          value="default"
        />
      ) : (
        devices.map((device) => {
          return (
            <DeviceSelectorOption
              id={device.deviceId}
              value={device.deviceId}
              label={device.label}
              key={device.deviceId}
              onChange={handleChange}
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
