import { DeviceSelector } from './DeviceSelector';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';

export type DeviceSelectorVideoProps = {
  title?: string;
};

export const DeviceSelectorVideo = ({ title }: DeviceSelectorVideoProps) => {
  const { t } = useI18n();
  const { useCameraState } = useCallStateHooks();
  const { camera, devices, selectedDevice } = useCameraState();

  return (
    <DeviceSelector
      devices={devices || []}
      selectedDeviceId={selectedDevice}
      onChange={async (deviceId) => {
        await camera.select(deviceId);
      }}
      title={title || t('Select a Camera')}
    />
  );
};
