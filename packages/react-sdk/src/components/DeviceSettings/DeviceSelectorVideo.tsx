import { useCallStateHooks } from '@stream-io/video-react-bindings';

import { DeviceSelector } from './DeviceSelector';
import { DeviceVideoPreviewItem } from './DeviceVideoPreviewItem';

export type DeviceSelectorVideoProps = {
  title?: string;
  /**
   * The visual style used to render the device selector.
   *
   * Note: `'preview'` is not reliable on mobile browsers. Use `'list'` or
   * `'dropdown'` on mobile devices.
   */
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
      PreviewItem={DeviceVideoPreviewItem}
    />
  );
};
