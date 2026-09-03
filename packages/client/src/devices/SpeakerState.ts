import { StateStore } from '@stream-io/state-store';
import { field, type Subscribable } from '../store/subscribable';
import { checkIfAudioOutputChangeSupported } from './devices';
import { Tracer } from '../stats';

export type SpeakerStateShape = {
  selectedDevice: string;
  volume: number;
};

export class SpeakerState {
  /**
   * The backing store. Use it to read or subscribe to several values at once.
   */
  readonly store = new StateStore<SpeakerStateShape>({
    selectedDevice: '',
    volume: 1,
  });

  /**
   * [Tells if the browser supports audio output change on 'audio' elements](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId).
   */
  readonly isDeviceSelectionSupported = checkIfAudioOutputChangeSupported();

  /**
   * The currently selected device
   *
   * Note: this feature is not supported in React Native
   */
  readonly selectedDevice$: Subscribable<string> = field(
    this.store,
    'selectedDevice',
  );

  /**
   * The currently selected volume
   *
   * Note: this feature is not supported in React Native
   */
  readonly volume$: Subscribable<number> = field(this.store, 'volume');

  private tracer: Tracer;

  constructor(tracer: Tracer) {
    this.tracer = tracer;
  }

  /**
   * The currently selected device
   *
   * Note: this feature is not supported in React Native
   */
  get selectedDevice() {
    return this.store.getLatestValue().selectedDevice;
  }

  /**
   * The currently selected volume
   *
   * Note: this feature is not supported in React Native
   */
  get volume() {
    return this.store.getLatestValue().volume;
  }

  /**
   * @internal
   * @param deviceId
   */
  setDevice(deviceId: string) {
    this.store.partialNext({ selectedDevice: deviceId });
    this.tracer.trace('navigator.mediaDevices.setSinkId', deviceId);
  }

  /**
   * @internal
   * @param volume
   */
  setVolume(volume: number) {
    this.store.partialNext({ volume });
  }
}
