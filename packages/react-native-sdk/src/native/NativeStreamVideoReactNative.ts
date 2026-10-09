import { TurboModuleRegistry, type TurboModule } from 'react-native';

import type {
  EventEmitter,
  UnsafeObject,
} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  /** Android only. */
  isInPiPMode(): boolean;

  /** Android only. */
  isCallAliveConfigured(): boolean;

  /** Android only. */
  startKeepCallAliveService(
    callCid: string,
    channelId: string,
    channelName: string,
    title: string,
    body: string,
    smallIconName: string | null,
  ): Promise<boolean>;

  /** Android only. */
  stopKeepCallAliveService(): Promise<boolean>;

  /** Android only. */
  canAutoEnterPipMode(value: boolean): void;

  /** Android only. */
  exitPipMode(): Promise<boolean>;

  /** Android only. */
  startThermalStatusUpdates(): void;

  /** Android only. */
  stopThermalStatusUpdates(): void;

  currentThermalState(): string;

  isLowPowerModeEnabled(): boolean;

  getBatteryState(): { charging: boolean; level: number };

  /** Android only. */
  takeScreenshot(streamURL: string): Promise<string>;

  /** Android only. */
  hasAudioOutputHardware(): boolean;

  /** Android only. */
  hasMicrophoneHardware(): boolean;

  /** Android only. */
  hasCameraHardware(): boolean;

  /** iOS only. */
  captureRef(reactTag: number, options: UnsafeObject): Promise<string>;

  /** iOS only. */
  checkPermission(permission: string): Promise<boolean>;

  playBusyTone(): Promise<boolean>;
  stopBusyTone(): Promise<boolean>;

  /** iOS only. */
  startInAppScreenCapture(includeAudio: boolean): Promise<void>;

  /** iOS only. */
  stopInAppScreenCapture(): Promise<void>;

  startScreenShareAudioMixing(): Promise<void>;
  stopScreenShareAudioMixing(): Promise<void>;

  startTrackRecording(options: {
    videoTrackId?: string;
    maxDurationMs?: number;
    targetWidth?: number;
    targetHeight?: number;
  }): Promise<string | null>;
  stopTrackRecording(): Promise<void>;
  clearStreamRecordings(): Promise<void>;
  getStreamRecordings(): Promise<string[]>;

  /** Android only. */
  readonly onPiPChange: EventEmitter<boolean>;

  /** iOS only. Payload `name` is `iOS_BroadcastStarted` or `iOS_BroadcastStopped`. */
  readonly onScreenShareEvent: EventEmitter<{ name: string }>;

  readonly onLowPowerModeChanged: EventEmitter<boolean>;

  readonly onThermalStateChanged: EventEmitter<string>;

  readonly onChargingStateChanged: EventEmitter<{
    charging: boolean;
    level: number;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('StreamVideoReactNative');
