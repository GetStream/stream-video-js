import React, { useMemo, useState } from 'react';
import { usePopper } from 'react-popper';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';

export const DeviceSettings = () => {
  const { devices, audioInputDeviceId, videoInputDeviceId, switchDevice } =
    useMediaDevices();
  const kinds = useMemo(() => {
    const audioInput: MediaDeviceInfo[] = [];
    const videoInput: MediaDeviceInfo[] = [];

    devices?.forEach((device) => {
      if (device.kind === 'audioinput') {
        audioInput.push(device);
      } else if (device.kind === 'videoinput') {
        videoInput.push(device);
      }
    });
    return {
      audioInput,
      videoInput,
    };
  }, [devices]);

  const [referenceElement, setReferenceElement] =
    useState<HTMLSpanElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement);
  const [isPopperOpen, setIsPopperOpen] = useState(false);
  return (
    <>
      <span
        className="str-video__device-settings__icon"
        tabIndex={0}
        ref={setReferenceElement}
        onClick={() => {
          setIsPopperOpen((v) => !v);
        }}
      />
      {isPopperOpen && (
        <div
          className="str-video__device-settings"
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <DeviceSelector
            devices={kinds.videoInput}
            label="Select a Camera"
            selectedDeviceId={videoInputDeviceId}
            onChange={(deviceId) => {
              switchDevice('videoinput', deviceId);
            }}
          />
          <DeviceSelector
            devices={kinds.audioInput}
            label="Select a Mic"
            selectedDeviceId={audioInputDeviceId}
            onChange={(deviceId) => {
              switchDevice('audioinput', deviceId);
            }}
          />
        </div>
      )}
    </>
  );
};

const DeviceSelector = (props: {
  devices: MediaDeviceInfo[];
  selectedDeviceId?: string;
  label: string;
  onChange?: (deviceId: string) => void;
}) => {
  const { devices, selectedDeviceId, label, onChange } = props;
  return (
    <div className="str-video__device-settings__device-kind">
      <div className="str-video__device-settings__device-selector-label">
        {label}
      </div>
      <select
        className="str-video__device-settings__device-selector"
        value={selectedDeviceId}
        onChange={(e) => {
          onChange?.(e.target.value);
        }}
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
};
