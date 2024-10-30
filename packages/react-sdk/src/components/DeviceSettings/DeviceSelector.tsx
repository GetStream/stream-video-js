import clsx from 'clsx';
import { ChangeEventHandler, useCallback } from 'react';

import { DropDownSelect, DropDownSelectOption } from '../DropdownSelect';
import { useMenuContext } from '../Menu';
import { useI18n } from '@stream-io/video-react-bindings';

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
  const { t } = useI18n();

  return (
    <div className="str-video__device-settings__device-kind">
      {title && (
        <div className="str-video__device-settings__device-selector-title">
          {title}
        </div>
      )}
      {devices.length === 0 ? (
        <DeviceSelectorOption
          id={`${type}--default`}
          label={t('Default')}
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
                close?.();
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
  icon: string;
}) => {
  const { devices = [], selectedDeviceId, title, onChange, icon } = props;
  const { t } = useI18n();

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
        defaultSelectedLabel={devices[selectedIndex]?.label ?? t('Default')}
        handleSelect={handleSelect}
      >
        {devices.length === 0 ? (
          <DropDownSelectOption icon={icon} label={t('Default')} selected />
        ) : (
          devices.map((device) => (
            <DropDownSelectOption
              key={device.deviceId}
              icon={icon}
              label={device.label}
              selected={
                device.deviceId === selectedDeviceId || devices.length === 1
              }
            />
          ))
        )}
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
  return <DeviceSelectorDropdown {...rest} icon={icon} />;
};
