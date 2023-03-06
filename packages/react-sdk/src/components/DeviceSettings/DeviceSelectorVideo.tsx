import { DeviceSelector } from './DeviceSelector';
import { useMediaDevices } from '../../contexts';

export type DeviceSelectorVideoProps = {
  title?: string;
};

export const DeviceSelectorVideo = ({ title }: DeviceSelectorVideoProps) => {
  const { videoDevices, selectedVideoDeviceId, switchDevice } =
    useMediaDevices();

  return (
    <DeviceSelector
      devices={videoDevices}
      selectedDeviceId={selectedVideoDeviceId}
      onChange={(deviceId) => {
        switchDevice('videoinput', deviceId);
      }}
      title={title || 'Select a Camera'}
    />
  );
};
