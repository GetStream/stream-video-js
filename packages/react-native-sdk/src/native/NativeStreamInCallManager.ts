import { TurboModuleRegistry, type TurboModule } from 'react-native';

import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  /** `'communicator'` or `'listener'`. Must be set before `start()`. */
  setAudioRole(role: string): void;

  /** `'speaker'` or `'earpiece'`. Must be set before `start()`. */
  setDefaultAudioDeviceEndpointType(type: string): void;

  /** Android only. Must be set before `start()`. */
  setTelecomManagedMode(enabled: boolean): void;

  /** Android only. Sticky for the process lifetime. */
  setDisableCommunicationModeWorkaround(disabled: boolean): void;

  setEnableStereoAudioOutput(enable: boolean): void;

  /** iOS only. The `AudioEngineMuteMode` value. */
  setMuteMode(mode: number): void;

  /** iOS only. */
  setRecordingAlwaysPreparedMode(enabled: boolean): void;

  setup(): void;
  start(): void;
  stop(): void;

  /** iOS only. */
  showAudioRoutePicker(): void;

  getAudioDeviceStatus(): Promise<{
    devices: { id: string; name: string; type: string }[];
    selectedDeviceId?: string;
    currentEndpointType: string;
  }>;

  chooseAudioDeviceEndpoint(deviceId: string): void;

  /** iOS only. */
  reapplyAudioRoute(): void;

  setForceSpeakerphoneOn(enable: boolean): void;

  /** Android only, no-op on iOS. */
  setMicrophoneMute(enable: boolean): void;

  logAudioState(): void;

  getAudioStateLog(): string;

  /** `playIfMuted` is Android only. */
  playSound(soundName: string, playIfMuted: boolean): void;
  stopSound(): void;

  muteAudioOutput(): void;
  unmuteAudioOutput(): void;

  /** SDK-managed route changes (not emitted for Telecom-managed calls). */
  readonly onAudioDeviceChanged: EventEmitter<{
    devices: { id: string; name: string; type: string }[];
    selectedDeviceId?: string;
    currentEndpointType: string;
  }>;

  /** iOS only. */
  readonly onAudioInterruption: EventEmitter<{
    source: string;
    phase: string;
    reason?: string;
    shouldResume?: boolean;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamInCallManager');
