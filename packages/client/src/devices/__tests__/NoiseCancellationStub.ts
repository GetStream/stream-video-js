import type { INoiseCancellation } from '@stream-io/audio-filters-web';

export class NoiseCancellationStub implements INoiseCancellation {
  private listeners: { [event: string]: Array<(arg: any) => void> } = {};

  canAutoEnable = async () => true;
  isSupported = () => true;
  init = () => Promise.resolve(undefined);
  isEnabled = async () => true;
  enable = async () => {
    this.emit('change', true);
  };
  disable = async () => {
    this.emit('change', false);
  };
  setSuppressionLevel = () => {};
  dispose = () => Promise.resolve(undefined);
  toFilter = () => (ms: MediaStream) => ({ output: ms });
  on = (event, callback) => {
    (this.listeners[event] ??= []).push(callback);
    return () => this.off(event, callback);
  };
  off = (event, callback) => {
    this.listeners[event] = (this.listeners[event] ?? []).filter(
      (cb) => cb !== callback,
    );
  };
  emit = (event: string, payload: unknown) => {
    this.listeners[event]?.forEach((l) => l(payload));
  };
  resume = () => {};
}
