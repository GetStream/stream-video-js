import NativeBroadcast from './NativeBroadcast';

export type CameraDirection = 'front' | 'back';

export class Broadcast {
  private readonly instanceId: string;

  private constructor(instanceId: string) {
    this.instanceId = instanceId;
  }

  static create() {
    const instanceId = NativeBroadcast.createInstance();
    return new Broadcast(instanceId);
  }

  destroy = () => {
    NativeBroadcast.destroyInstance(this.instanceId);
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
