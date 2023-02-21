import { DeviceSelector } from './DeviceSelector';
import { useMediaDevices } from '../../contexts';

export type DeviceSelectorAudioInputProps = {
  title?: string;
};

export const DeviceSelectorAudioInput = ({
  title = 'Select a Mic',
}: DeviceSelectorAudioInputProps) => {
  const { audioInputDevices, selectedAudioInputDeviceId, switchDevice } =
    useMediaDevices();

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
  title = 'Select audio output device',
}: DeviceSelectorAudioOutputProps) => {
  const {
    audioOutputDevices,
    isAudioOutputChangeSupported,
    selectedAudioOutputDeviceId,
    switchDevice,
  } = useMediaDevices();

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

export const DeviceSelectorAudio = () => (
  <>
    <DeviceSelectorAudioInput />
    <DeviceSelectorAudioOutput />
  </>
);
