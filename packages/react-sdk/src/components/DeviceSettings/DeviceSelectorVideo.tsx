import clsx from 'clsx';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

import { useDeviceList } from '../../hooks';
import { useMenuContext } from '../Menu';
import { DeviceSelector } from './DeviceSelector';
import { DeviceVideoPreview } from './DeviceVideoPreview';

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

  if (visualType === 'preview') {
    return (
      <DeviceSelectorVideoPreview
        devices={devices || []}
        selectedDeviceId={selectedDevice}
        title={title}
        onChange={async (deviceId) => {
          await camera.select(deviceId);
        }}
      />
    );
  }

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

const DeviceSelectorVideoPreview = (props: {
  devices: MediaDeviceInfo[];
  selectedDeviceId?: string;
  title?: string;
  onChange?: (deviceId: string) => void;
}) => {
  const { devices = [], selectedDeviceId, title, onChange } = props;
  const { close } = useMenuContext();
  const { deviceList } = useDeviceList(devices, selectedDeviceId);

  return (
    <div className="str-video__device-settings__device-kind">
      {title && (
        <div className="str-video__device-settings__device-selector-title str-video__device-settings__device-selector-title--truncate">
          {title}
        </div>
      )}
      {deviceList.map((device) => {
        if (device.deviceId === 'default') return null;

        return (
          <div
            key={device.deviceId}
            className={clsx('str-video__device-preview', {
              'str-video__device-preview--selected': device.isSelected,
            })}
            onClick={() => {
              onChange?.(device.deviceId);
              close?.();
            }}
          >
            <DeviceVideoPreview deviceId={device.deviceId} />
            <span className="str-video__device-preview__label">
              {device.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
