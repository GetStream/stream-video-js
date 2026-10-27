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

  /**
   * iOS only. Resolves whether the shared audio session is active, polling
   * until `timeoutMs` after the pending `start()` work. Resolves `true` on Android.
   */
  waitForAudioSessionActive(timeoutMs: number): Promise<boolean>;

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

  logAudioState(): void;

  getAudioStateLog(): string;

  /** iOS only. Snapshot of the shared `AVAudioSession`; empty on Android. */
  getAudioSessionState(): {
    category?: string;
    mode?: string;
    options?: number;
    isActive?: boolean;
    isOtherAudioPlaying?: boolean;
    callingxOwnsSession?: boolean;
    route?: string;
    micPermission?: string;
  };

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

  /** iOS only. In-call manager audio session configuration/activation results. */
  readonly onAudioSessionDiagnostic: EventEmitter<{
    event: string;
    error?: string;
    muteMode?: number;
    enabled?: boolean;
    result?: number;
    category?: string;
    mode?: string;
    options?: number;
    isActive?: boolean;
    isOtherAudioPlaying?: boolean;
    callingxOwnsSession?: boolean;
    route?: string;
    micPermission?: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamInCallManager');
