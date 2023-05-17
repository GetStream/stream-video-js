import { DeviceSelector } from './DeviceSelector';
import {
  useMediaDevices,
  useObserveAudioInputDevices,
  useObserveAudioOutputDevices,
} from '../../core';

export type DeviceSelectorAudioInputProps = {
  title?: string;
};

export const DeviceSelectorAudioInput = ({
  title = 'Select a Mic',
}: DeviceSelectorAudioInputProps) => {
  const { selectedAudioInputDeviceId, switchDevice } = useMediaDevices();
  const audioInputDevices = useObserveAudioInputDevices();

  return (
    <DeviceSelector
      devices={audioInputDevices}
      selectedDeviceId={selectedAudioInputDeviceId}
      onChange={(deviceId) => {
        switchDevice('audioinput', deviceId);
      }}
      title={title}
    />
  );
};

export type DeviceSelectorAudioOutputProps = {
  title?: string;
};

export const DeviceSelectorAudioOutput = ({
  title = 'Select speakers',
}: DeviceSelectorAudioOutputProps) => {
  const {
    isAudioOutputChangeSupported,
    selectedAudioOutputDeviceId,
    switchDevice,
  } = useMediaDevices();

  const audioOutputDevices = useObserveAudioOutputDevices();

  if (!isAudioOutputChangeSupported) return null;

  return (
    <DeviceSelector
      devices={audioOutputDevices}
      selectedDeviceId={selectedAudioOutputDeviceId}
      onChange={(deviceId) => {
        switchDevice('audiooutput', deviceId);
      }}
      title={title}
    />
  );
};
