import { DeviceSelector } from './DeviceSelector';
import { useMediaDevices, useVideoDevices } from '../../core';

export type DeviceSelectorVideoProps = {
  title?: string;
};

export const DeviceSelectorVideo = ({ title }: DeviceSelectorVideoProps) => {
  const { selectedVideoDeviceId, switchDevice } = useMediaDevices();
  const videoDevices = useVideoDevices();

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
