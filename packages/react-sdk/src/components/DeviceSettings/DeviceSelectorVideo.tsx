import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { DeviceListItem } from '../../hooks';

import { DeviceSelector } from './DeviceSelector';
import { DeviceVideoPreviewItem } from './DeviceVideoPreviewItem';

const renderVideoPreviewItem = (
  device: DeviceListItem,
  onSelect: (deviceId: string) => void,
) => <DeviceVideoPreviewItem device={device} onSelect={onSelect} />;

export type DeviceSelectorVideoProps = {
  title?: string;
  visualType?: 'list' | 'dropdown' | 'preview';
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
      type="videoinput"
      selectedDeviceId={selectedDevice}
      onChange={async (deviceId) => {
        await camera.select(deviceId);
      }}
      title={title}
      visualType={visualType}
      icon="camera"
      renderItem={renderVideoPreviewItem}
    />
  );
};
