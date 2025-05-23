import type { INoiseCancellation } from '@stream-io/audio-filters-web';

export class NoiseCancellationStub implements INoiseCancellation {
  private listeners: { [event: string]: Array<(arg: boolean) => void> } = {};

  isSupported = () => true;
  init = () => Promise.resolve(undefined);
  isEnabled = () => true;
  enable = () => this.listeners['change']?.forEach((l) => l(true));
  disable = () => this.listeners['change']?.forEach((l) => l(false));
  setSuppressionLevel = () => {};
  dispose = () => Promise.resolve(undefined);
  toFilter = () => (ms: MediaStream) => ({ output: ms });
  on = (event, callback) => {
    (this.listeners[event] ??= []).push(callback);
    return () => {};
  };
  off = () => {};
}
