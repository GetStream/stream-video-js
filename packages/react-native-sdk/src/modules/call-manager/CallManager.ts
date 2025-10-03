import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { AudioDeviceStatus, StreamInCallManagerConfig } from './types';

const NativeManager = NativeModules.StreamInCallManager;

const invariant = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

class AndroidCallManager {
  private eventEmitter?: NativeEventEmitter;

  getAudioDeviceStatus = async () => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    return NativeManager.getAudioDeviceStatus();
  };

  selectAudioDevice = (endpointName: string) => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    NativeManager.chooseAudioDeviceEndpoint(endpointName);
  };

  addAudioDeviceChangeListener = (
    onChange: (audioDeviceStatus: AudioDeviceStatus) => void,
  ) => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    this.eventEmitter ??= new NativeEventEmitter(NativeManager);
    const s = this.eventEmitter.addListener('onAudioDeviceChanged', onChange);
    return () => s.remove();
  };
}

class IOSCallManager {
  showDeviceSelector = () => {
    invariant(Platform.OS === 'ios', 'Supported only on iOS');
    NativeManager.showAudioRoutePicker();
  };
}

class SpeakerManager {
  setMute = (mute: boolean) => {
    if (mute) {
      NativeManager.muteAudioOutput();
    } else {
      NativeManager.unmuteAudioOutput();
    }
  };
}

export class CallManager {
  android = new AndroidCallManager();
  ios = new IOSCallManager();
  speaker = new SpeakerManager();

  start = (config?: StreamInCallManagerConfig) => {
    NativeManager.setAudioRole(config?.audioRole ?? 'communicator');
    if (config?.audioRole === 'communicator') {
      const type = config.deviceEndpointType ?? 'speaker';
      NativeManager.setDefaultAudioDeviceEndpointType(type);
    }
    NativeManager.start();
  };

  stop = () => {
    NativeManager.stop();
  };

  logAudioState = () => NativeManager.logAudioState();
}
