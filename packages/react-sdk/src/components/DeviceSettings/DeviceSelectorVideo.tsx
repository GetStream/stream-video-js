import { DeviceSelector } from './DeviceSelector';
import { getCallStateHooks } from '@stream-io/video-react-bindings';

export type DeviceSelectorVideoProps = {
  title?: string;
  visualType?: 'list' | 'dropdown';
};

const { useCameraState } = getCallStateHooks();
export const DeviceSelectorVideo = ({
  title,
  visualType,
}: DeviceSelectorVideoProps) => {
  const { camera, devices, selectedDevice } = useCameraState();

  return (
    <DeviceSelector
      devices={devices || []}
      type="videoinput"
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
