export type AudioDeviceEndpointType =
  | 'Bluetooth Device'
  | 'Earpiece'
  | 'Speaker'
  | 'Wired Headset'
  | 'Unknown'
  | (string & {});

export type AudioDeviceStatus = {
  devices: string[];
  currentEndpointType: AudioDeviceEndpointType;
  selectedDevice: string;
};

export type AudioRole = 'communicator' | 'listener';
export type DeviceEndpointType = 'speaker' | 'earpiece';

export type StreamInCallManagerConfig =
  | {
      audioRole: 'communicator';
      deviceEndpointType?: DeviceEndpointType;
    }
  | {
      audioRole: 'listener';
    };
