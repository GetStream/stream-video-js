import NativeBroadcast, { type Preset } from './NativeBroadcast';
import { BehaviorSubject } from 'rxjs';
import {
  type EventSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {
  type CameraDirection,
  type MediaState,
  TypedNativeEventEmitter,
} from './events';

const BroadcastEvents = new TypedNativeEventEmitter(
  new NativeEventEmitter(NativeModules.BroadcastEventEmitter),
);

export class Presets {
  /**
   * HD portrait mode preset. Recommended for most use cases.
   */
  static PORTRAIT_HD: Preset = {
    width: 720,
    height: 1280,
    frameRate: 30,
    videoBitrate: 3_000_000,
    audioBitrate: 128_000,
  };

  /**
   * Full HD portrait mode preset. Recommended for high-resolution broadcasts,
   * but it can be slow on older devices.
   */
  static PORTRAIT_FULL_HD: Preset = {
    width: 1080,
    height: 1920,
    frameRate: 30,
    videoBitrate: 4_000_000,
    audioBitrate: 128_000,
  };
}

export class Broadcast {
  private readonly instanceId: string;

  // Subjects holding native-synchronized state
  readonly running$ = new BehaviorSubject<boolean>(false);
  readonly mediaState$ = new BehaviorSubject<MediaState>({
    cameraEnabled: true,
    microphoneEnabled: true,
    cameraDirection: 'front',
  });

  private subscriptions: EventSubscription[] = [];

  private constructor(instanceId: string) {
    this.instanceId = instanceId;

    // Subscribe to native events for this instance
    this.subscriptions.push(
      BroadcastEvents.addListener('broadcast.started', (payload) => {
        if (payload.instanceId !== this.instanceId) return;
        this.running$.next(payload.running);
      }),
    );

    this.subscriptions.push(
      BroadcastEvents.addListener('broadcast.mediaStateUpdated', (payload) => {
        const { instanceId: id, ...next } = payload;
        if (id !== this.instanceId) return;
        this.mediaState$.next(next);
      }),
    );
  }

  static create(preset: Preset = Presets.PORTRAIT_HD): Broadcast {
    const instanceId = NativeBroadcast.createInstance(preset);
    return new Broadcast(instanceId);
  }

  destroy = () => {
    // Remove listeners first to avoid receiving post-destroy events
    this.subscriptions.forEach((s) => s.remove());
    this.subscriptions = [];

    NativeBroadcast.destroyInstance(this.instanceId);

    // Complete subjects to signal teardown to subscribers
    this.running$.complete();
    this.mediaState$.complete();
  };

  get id() {
    return this.instanceId;
  }

  // Control methods
  start = async (endpoint: string, streamName: string) => {
    return NativeBroadcast.start(this.instanceId, endpoint, streamName);
  };

  stop = async () => {
    return NativeBroadcast.stop(this.instanceId);
  };

  setCameraDirection = (direction: CameraDirection) => {
    NativeBroadcast.setCameraDirection(this.instanceId, direction);
  };

  setCameraEnabled = (enabled: boolean) => {
    NativeBroadcast.setCameraEnabled(this.instanceId, enabled);
  };

  setMicrophoneEnabled = (enabled: boolean) => {
    NativeBroadcast.setMicrophoneEnabled(this.instanceId, enabled);
  };
}
