import { DeviceSelector } from './DeviceSelector';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

export type DeviceSelectorVideoProps = {
  title?: string;
  visualType?: 'list' | 'dropdown';
};

export const DeviceSelectorVideo = ({
  title,
  visualType,
}: DeviceSelectorVideoProps) => {
  const { useCameraState } = useCallStateHooks();
  const { camera, devices, selectedDevice } = useCameraState();

  return (
    <DeviceSelector
      devices={devices || []}
      selectedDeviceId={selectedDevice}
      onChange={async (deviceId) => {
        await camera.select(deviceId);
      }}
      title={title}
      visualType={visualType}
      icon="camera"
    />
  );
};
