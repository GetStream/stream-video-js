import { Props } from './DeviceList';

export const KichinSink: Props = {
  selectedDeviceId: '123124-1dsas32',
  devices: [
    {
      deviceId: '123124-1dsas32',
      groupId: 'video',
      kind: 'videoinput',
      label: 'Front face camera',
    } as MediaDeviceInfo,
  ],
  selectDevice: () => {
    console.log('selected device');
  },
};
