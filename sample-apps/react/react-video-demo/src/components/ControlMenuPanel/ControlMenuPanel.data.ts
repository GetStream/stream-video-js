import { Props } from './ControlMenuPanel';

export const KichinSink: Props = {
  selectedDeviceId: '123124-1dsas32',
  devices: [
    {
      deviceId: '123124-1dsas32',
      groupId: 'video',
      kind: 'videoinput',
      label: 'Front face camera',
    },
  ],
  title: 'Settings',
  selectDevice: () => {
    console.log('selected device');
  },
};
