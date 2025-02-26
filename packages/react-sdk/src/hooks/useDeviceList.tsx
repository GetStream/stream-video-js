import { useI18n } from '@stream-io/video-react-bindings';
import { useMemo } from 'react';

export interface DeviceListItem {
  deviceId: string;
  label: string;
  isSelected: boolean;
}

/**
 * Utility hook that helps render a list of devices or implement a device selector.
 * Compared someting like `useCameraState().devices`, it has some handy features:
 * 1. Adds the "Default" device to the list if applicable (either the user did not
 * select a device, or a previously selected device is no longer available).
 * 2. Maps the device list to a format more suitable for rendering.
 */
export function useDeviceList(
  devices: MediaDeviceInfo[],
  selectedDeviceId: string | undefined,
): {
  deviceList: DeviceListItem[];
  selectedDevice: DeviceListItem;
  selectedIndex: number;
} {
  const { t } = useI18n();

  return useMemo(() => {
    let selectedDevice: DeviceListItem | null = null;
    let selectedIndex: number | null = null;

    const deviceList: DeviceListItem[] = devices.map((d, i) => {
      const isSelected = d.deviceId === selectedDeviceId;
      const device = { deviceId: d.deviceId, label: d.label, isSelected };

      if (isSelected) {
        selectedDevice = device;
        selectedIndex = i;
      }

      return device;
    });

    if (selectedDevice === null || selectedIndex === null) {
      const defaultDevice = {
        deviceId: 'default',
        label: t('Default'),
        isSelected: true,
      };

      selectedDevice = defaultDevice;
      selectedIndex = 0;
      deviceList.unshift(defaultDevice);
    }

    return { deviceList, selectedDevice, selectedIndex };
  }, [devices, selectedDeviceId, t]);
}
