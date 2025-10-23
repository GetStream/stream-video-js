import { NativeEventEmitter } from 'react-native';

export type CameraDirection = 'front' | 'back';

export type MediaState = {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  cameraDirection: CameraDirection;
};

// Event typings
export type BroadcastStartedEvent = {
  instanceId: string;
  running: boolean;
};

export type BroadcastMediaStateUpdatedEvent = MediaState & {
  instanceId: string;
};

type BroadcastEvents = {
  'broadcast.started': BroadcastStartedEvent;
  'broadcast.mediaStateUpdated': BroadcastMediaStateUpdatedEvent;
};

export class TypedNativeEventEmitter {
  constructor(private readonly emitter: NativeEventEmitter) {}

  addListener<
    E extends Extract<keyof BroadcastEvents, string>,
    V = BroadcastEvents[E],
  >(event: E, listener: (payload: V) => void) {
    return this.emitter.addListener(
      event,
      listener as unknown as (...args: any[]) => any,
    );
  }
}
