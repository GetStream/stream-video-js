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

export type IOSAudioInterruptionEvent = {
  source: 'callmanager' | 'callingx';
  phase: 'began' | 'ended';
  reason?: 'default' | 'builtInMicMuted' | 'routeDisconnected' | (string & {});
  shouldResume?: boolean;
};

export type StreamInCallManagerConfig =
  | {
      audioRole: 'communicator';
      deviceEndpointType?: DeviceEndpointType;
    }
  | {
      audioRole: 'listener';
      enableStereoAudioOutput?: boolean;
    };
