import clsx from 'clsx';
import {
  ChangeEventHandler,
  ComponentType,
  PropsWithChildren,
  useCallback,
} from 'react';

import { DeviceListItem, useDeviceList } from '../../hooks';
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

const DeviceSelectorList = (
  props: PropsWithChildren<{
    devices: MediaDeviceInfo[];
    type: DeviceSelectorType;
    selectedDeviceId?: string;
    title?: string;
    onChange?: (deviceId: string) => void;
  }>,
) => {
  const {
    devices = [],
    selectedDeviceId,
    title,
    type,
    onChange,
    children,
  } = props;
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
      {children}
    </div>
  );
};

export type PreviewItemProps = {
  device: DeviceListItem;
  onSelect: (deviceId: string) => void;
};

const DeviceSelectorPreview = (
  props: PropsWithChildren<{
    devices: MediaDeviceInfo[];
    selectedDeviceId?: string;
    title?: string;
    onChange?: (deviceId: string) => void;
    PreviewItem: ComponentType<PreviewItemProps>;
  }>,
) => {
  const {
    devices = [],
    selectedDeviceId,
    title,
    onChange,
    children,
    PreviewItem,
  } = props;
  const { close } = useMenuContext();
  const { deviceList } = useDeviceList(devices, selectedDeviceId);

  const onSelect = useCallback(
    (deviceId: string) => {
      onChange?.(deviceId);
      close?.();
    },
    [onChange, close],
  );

  return (
    <div className="str-video__device-settings__device-kind">
      {title && (
        <div className="str-video__device-settings__device-selector-title">
          {title}
        </div>
      )}
      {deviceList.map((device) => (
        <PreviewItem
          key={device.deviceId}
          device={device}
          onSelect={onSelect}
        />
      ))}
      {children}
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

export const DeviceSelector = (
  props: PropsWithChildren<{
    devices: MediaDeviceInfo[];
    icon: string;
    type: DeviceSelectorType;
    selectedDeviceId?: string;
    title?: string;
    onChange?: (deviceId: string) => void;
  }> &
    (
      | { visualType?: 'list' | 'dropdown' }
      | { visualType: 'preview'; PreviewItem: ComponentType<PreviewItemProps> }
    ),
) => {
  if (props.visualType === 'preview') {
    const { PreviewItem, ...rest } = props;
    return <DeviceSelectorPreview {...rest} PreviewItem={PreviewItem} />;
  }

  const { visualType = 'list', icon, ...rest } = props;
  if (visualType === 'list') {
    return <DeviceSelectorList {...rest} />;
  }
  return <DeviceSelectorDropdown {...rest} icon={icon} />;
};
