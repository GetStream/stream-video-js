import { useI18n } from '@stream-io/video-react-bindings';
import { useMemo } from 'react';

export interface DeviceListItem {
  deviceId: string;
  label: string;
  isSelected: boolean;
}

/**
 * Utility hook that helps render a list of devices or implement a device selector.
 * Compared to someting like `useCameraState().devices`, it has some handy features:
 * 1. Adds the "Default" device to the list if applicable (either the user did not
 * select a device, or a previously selected device is no longer available).
 * 2. Maps the device list to a format more suitable for rendering.
 */
export function useDeviceList(
  devices: MediaDeviceInfo[],
  selectedDeviceId: string | undefined,
): {
  deviceList: DeviceListItem[];
  selectedDeviceInfo: DeviceListItem;
  selectedIndex: number;
} {
  const { t } = useI18n();

  return useMemo(() => {
    const selectedIndex = devices.findIndex(
      (d) => d.deviceId === selectedDeviceId,
    );

    let deviceList: DeviceListItem[];

    if (selectedIndex === -1) {
      const defaultDevice: DeviceListItem = {
        deviceId: 'default',
        label: t('Default'),
        isSelected: true,
      };

      deviceList = [
        defaultDevice,
        ...devices.map((d) => ({
          deviceId: d.deviceId,
          label: d.label,
          isSelected: false,
        })),
      ];

      return {
        deviceList,
        selectedDeviceInfo: defaultDevice,
        selectedIndex: 0,
      };
    }

    deviceList = devices.map((d) => ({
      deviceId: d.deviceId,
      label: d.label,
      isSelected: d.deviceId === selectedDeviceId,
    }));

    return {
      deviceList,
      selectedDeviceInfo: deviceList[selectedIndex],
      selectedIndex,
    };
  }, [devices, selectedDeviceId, t]);
}
