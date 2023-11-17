import { DeviceSelector } from './DeviceSelector';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';

export type DeviceSelectorVideoProps = {
  title?: string;
  visualType?: 'list' | 'dropdown';
};

export const DeviceSelectorVideo = ({
  title,
  visualType,
}: DeviceSelectorVideoProps) => {
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
      visualType={visualType}
      icon="camera"
    />
  );
};
