import NativeBroadcast from './NativeBroadcast';
import { BehaviorSubject } from 'rxjs';
import { NativeEventEmitter, NativeModules } from 'react-native';
import {
  type CameraDirection,
  type MediaState,
  TypedNativeEventEmitter,
} from './events';

const BroadcastEvents = new TypedNativeEventEmitter(
  new NativeEventEmitter(NativeModules.BroadcastEventEmitter),
);

export class Broadcast {
  private readonly instanceId: string;

  // Subjects holding native-synchronized state
  readonly running$ = new BehaviorSubject<boolean>(false);
  readonly mediaState$ = new BehaviorSubject<MediaState>({
    cameraEnabled: true,
    microphoneEnabled: true,
    cameraDirection: 'front',
  });

  private subscriptions: { remove: () => void }[] = [];

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

  static create() {
    const instanceId = NativeBroadcast.createInstance();
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
