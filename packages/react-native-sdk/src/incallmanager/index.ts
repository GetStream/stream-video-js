import { NativeModules, NativeEventEmitter } from 'react-native';

const InCallManagerNativeModule = NativeModules.InCallManager;

const InCallManagerEventEmitter = new NativeEventEmitter(
  InCallManagerNativeModule,
);

export type AudioDeviceStatus = {
  availableAudioDeviceEndpointNamesList: string[];
  selectedAudioDeviceEndpointType: string;
  selectedAudioDeviceName: string;
};

type AudioDeviceStatusUnparsed = {
  availableAudioDeviceEndpointNamesList: string;
  selectedAudioDeviceEndpointType: string;
  selectedAudioDeviceName: string;
};

/**
 * Start the in call manager.
 * @param callAudioMode - The callAudioMode to start the in call manager with.
 *
 * **"video"** - The call will start with speaker as audio output route unless bluetooth or wired headset is connected.
 *
 * **"audio"** - The call will start with earpiece as audio output route unless bluetooth or wired headset is connected.
 */
function start(callAudioMode: 'video' | 'audio') {
  InCallManagerNativeModule.start(callAudioMode, '');
}

/**
 * Stop the in call manager.
 */
function stop() {
  InCallManagerNativeModule.stop('');
}

/**
 * Add a listener for audio device status changes.
 * @param onChange - The function to call when the audio device status changes.
 * @returns A function to remove the listener.
 */
function addAudioDeviceStatusChangeListener(
  onChange: (audioDeviceStatus: AudioDeviceStatus) => void,
) {
  const subscription = InCallManagerEventEmitter.addListener(
    'onAudioDeviceChanged',
    (audioDeviceStatus: AudioDeviceStatusUnparsed) => {
      console.log('audioDeviceStatusChange');
      onChange(parseAudioDeviceStatus(audioDeviceStatus));
    },
  );

  return () => subscription.remove();
}

/**
 * Choose an audio device endpoint.
 * @param endpointName - The name of the audio device endpoint to choose.
 * @returns The audio device status.
 */
function chooseAudioDeviceEndpoint(endpointName: string) {
  InCallManagerNativeModule.chooseAudioDeviceEndpoint(endpointName);
}

function parseAudioDeviceStatus(
  audioDeviceStatusUnparsed: AudioDeviceStatusUnparsed,
) {
  console.log('audioDeviceStatusUnparsed', audioDeviceStatusUnparsed);
  const audioDeviceStatus: AudioDeviceStatus = {
    availableAudioDeviceEndpointNamesList: JSON.parse(
      audioDeviceStatusUnparsed.availableAudioDeviceEndpointNamesList,
    ),
    selectedAudioDeviceEndpointType:
      audioDeviceStatusUnparsed.selectedAudioDeviceEndpointType,
    selectedAudioDeviceName: audioDeviceStatusUnparsed.selectedAudioDeviceName,
  };
  return audioDeviceStatus;
}

/**
 * Get the current audio device status.
 * @returns The audio device status.
 */
async function getAudioDeviceStatus() {
  const audioDeviceStatus: AudioDeviceStatus = parseAudioDeviceStatus(
    await InCallManagerNativeModule.getAudioDeviceStatus(),
  );
  return audioDeviceStatus;
}

/**
 * Log the current audio state.
 * Meant for debugging purposes.
 */
function logAudioState() {
  InCallManagerNativeModule.logAudioState();
}

export const InCallManager = {
  start,
  stop,
  getAudioDeviceStatus,
  chooseAudioDeviceEndpoint,
  addAudioDeviceStatusChangeListener,
  logAudioState,
};
