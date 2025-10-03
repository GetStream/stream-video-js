export type AudioDeviceStatus = {
  devices: string[];
  currentEndpointType: string;
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
