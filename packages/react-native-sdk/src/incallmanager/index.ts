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

export type AudioRole = 'communicator' | 'listener';

/**
 * Sets the audio role for the call. This should be done before calling **start()**.
 *
 * @param audioRole The audio role to set. It can be one of the following:
 * - `'communicator'`: (Default) For use cases like video or voice calls.
 * It prioritizes low latency and allows manual audio device switching.
 * Audio routing is controlled by the SDK.
 * - `'listener'`: For use cases like livestream viewing.
 * It prioritizes high-quality stereo audio streaming.
 * Audio routing is controlled by the OS and manual switching is not supported.
 */
function setAudioRole(audioRole: AudioRole) {
  InCallManagerNativeModule.setAudioRole(audioRole);
}

/**
 * Start the in call manager.
 */
function start() {
  InCallManagerNativeModule.start();
}

/**
 * Stop the in call manager.
 */
function stop() {
  InCallManagerNativeModule.stop();
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
 * Mutes the audio output of the device.
 */
function muteAudioOutput() {
  InCallManagerNativeModule.muteAudioOutput();
}

/**
 * Unmutes the audio output of the device.
 */
function unmuteAudioOutput() {
  InCallManagerNativeModule.unmuteAudioOutput();
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
  setAudioRole,
  muteAudioOutput,
  unmuteAudioOutput,
};
