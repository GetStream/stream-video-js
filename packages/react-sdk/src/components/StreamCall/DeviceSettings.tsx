import { Call } from '@stream-io/video-client';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { useState } from 'react';
import { usePopper } from 'react-popper';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';

export const DeviceSettings = (props: { activeCall: Call }) => {
  const { activeCall } = props;
  const {
    audioDevices,
    videoDevices,
    audioOutputDevices,
    isAudioOutputChangeSupported,
    switchDevice,
  } = useMediaDevices();

  const [referenceElement, setReferenceElement] =
    useState<HTMLSpanElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement);
  const [isPopperOpen, setIsPopperOpen] = useState(false);

  const localParticipant = useLocalParticipant();

  const setAudioOutputDevice = (deviceId: string) => {
    activeCall?.setAudioOutputDevice(deviceId);
  };

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
            devices={videoDevices}
            label="Select a Camera"
            selectedDeviceId={localParticipant?.videoDeviceId}
            onChange={(deviceId) => {
              switchDevice('videoinput', deviceId);
            }}
          />
          <DeviceSelector
            devices={audioDevices}
            label="Select a Mic"
            selectedDeviceId={localParticipant?.audioDeviceId}
            onChange={(deviceId) => {
              switchDevice('audioinput', deviceId);
            }}
          />
          {isAudioOutputChangeSupported && (
            <DeviceSelector
              devices={audioOutputDevices}
              label="Select audio output"
              selectedDeviceId={localParticipant?.audioOutputDeviceId}
              onChange={(deviceId) => {
                setAudioOutputDevice(deviceId);
              }}
            />
          )}
        </div>
      )}
    </>
  );
};

export const DeviceSelector = (props: {
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
