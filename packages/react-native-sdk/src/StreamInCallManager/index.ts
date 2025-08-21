import { getLogger } from '@stream-io/video-client';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const StreamInCallManagerNativeModule = NativeModules.InCallManager;

const logger = getLogger(['StreamInCallManager']);

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
export type DefaultAudioDeviceEndpointType = 'speaker' | 'earpiece';

export type StreamInCallManagerConfig =
  | {
      audioRole: 'communicator';
      defaultAudioDeviceEndpointType?: DefaultAudioDeviceEndpointType;
    }
  | {
      audioRole: 'listener';
    };

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
  StreamInCallManagerNativeModule.setAudioRole(audioRole);
}

/**
 * Sets the default audio device endpoint type for the call. This should be done before calling **start()**.
 * @param defaultAudioDeviceEndpointType The default audio device endpoint type to set. It can be one of the following:
 * - `'speaker'`: (Default) For normal video or voice calls.
 * - `'earpiece'`: For voice only mobile call type scenarios.
 */
function setDefaultAudioDeviceEndpointType(
  defaultAudioDeviceEndpointType: DefaultAudioDeviceEndpointType,
) {
  StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
    defaultAudioDeviceEndpointType,
  );
}

/**
 * Start the in call manager.
 */
function start(
  config: StreamInCallManagerConfig = {
    audioRole: 'communicator',
    defaultAudioDeviceEndpointType: 'speaker',
  },
) {
  setAudioRole(config.audioRole);

  if (config.audioRole === 'communicator') {
    setDefaultAudioDeviceEndpointType(
      config.defaultAudioDeviceEndpointType ?? 'speaker',
    );
  }

  StreamInCallManagerNativeModule.start();
}

/**
 * Stop the in call manager.
 */
function stop() {
  StreamInCallManagerNativeModule.stop();
}

function showIOSAudioRoutePicker() {
  if (Platform.OS !== 'ios') {
    logger('warn', 'showAudioRoutePicker is supported only on iOS');
    return;
  }
  StreamInCallManagerNativeModule.showAudioRoutePicker();
}

/**
 * Add a listener for audio device status changes.
 * @param onChange - The function to call when the audio device status changes.
 * @returns A function to remove the listener.
 */
function addAndroidAudioDeviceStatusChangeListener(
  onChange: (audioDeviceStatus: AudioDeviceStatus) => void,
) {
  if (Platform.OS !== 'android') {
    logger(
      'warn',
      'addAndroidAudioDeviceStatusChangeListener is supported only on Android',
    );
    return;
  }
  const InCallManagerEventEmitter = new NativeEventEmitter(
    StreamInCallManagerNativeModule,
  );
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
function chooseAndroidAudioDeviceEndpoint(endpointName: string) {
  if (Platform.OS !== 'android') {
    logger(
      'warn',
      'chooseAndroidAudioDeviceEndpoint is supported only on Android',
    );
    return;
  }
  StreamInCallManagerNativeModule.chooseAudioDeviceEndpoint(endpointName);
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
async function getAndroidAudioDeviceStatus() {
  if (Platform.OS !== 'android') {
    logger('warn', 'getAndroidAudioDeviceStatus is supported only on Android');
    return;
  }
  const audioDeviceStatus: AudioDeviceStatus = parseAudioDeviceStatus(
    await StreamInCallManagerNativeModule.getAudioDeviceStatus(),
  );
  return audioDeviceStatus;
}

/**
 * Log the current audio state natively.
 * Meant for debugging purposes.
 */
function logAudioState() {
  StreamInCallManagerNativeModule.logAudioState();
}

export const StreamInCallManager = {
  start,
  stop,
  getAndroidAudioDeviceStatus,
  chooseAndroidAudioDeviceEndpoint,
  addAndroidAudioDeviceStatusChangeListener,
  logAudioState,
  showIOSAudioRoutePicker,
};
