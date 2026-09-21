import NoiseCancellationReactNative from './NativeNoiseCancellationReactNative';
import type { Events, INoiseCancellation } from './types';

/**
 * A wrapper around the native stream noise cancellation SDK.
 */
export class NoiseCancellation implements INoiseCancellation {
  private readonly listeners: Partial<Record<keyof Events, Array<any>>> = {};

  /**
   * Checks if the noise cancellation is supported on this platform.
   * Make sure you call this method before trying to enable the noise cancellation.
   */
  isSupported = () => true;

  /**
   * Checks if the noise cancellation can be automatically enabled for the current device.
   * In react native, it will be auto enabled only if the device supports advanced audio processing.
   */
  canAutoEnable = async () => deviceSupportsAdvancedAudioProcessing();

  init = () => Promise.resolve();

  /**
   * Enables the noise cancellation.
   */
  enable = async () => {
    await NoiseCancellationReactNative.setEnabled(true);
    this.dispatch('change', true);
  };

  /**
   * Disables the noise cancellation.
   */
  disable = async () => {
    await NoiseCancellationReactNative.setEnabled(false);
    this.dispatch('change', false);
  };

  /**
   * Disposes the instance and releases all resources.
   */
  dispose = async () => Promise.resolve();

  // no-op in React Native
  setSuppressionLevel = () => {};

  // no-op in React Native
  resume = () => {};

  isEnabled = async () => {
    return isEnabled();
  };

  /**
   * A utility method convenient for our Microphone filters API.
   * Not relevant in React Native.
   */
  toFilter = () => (mediaStream: MediaStream) => {
    return { output: mediaStream };
  };

  /**
   * Registers the given callback to the event type;
   *
   * @param event the event to listen.
   * @param callback the callback to call.
   */
  on = <E extends keyof Events, T = Events[E]>(event: E, callback: T) => {
    (this.listeners[event] ??= [] as T[]).push(callback);
    return () => {
      this.off(event, callback);
    };
  };

  /**
   * Unregisters the given callback for the event type.
   *
   * @param event the event.
   * @param callback the callback to unregister.
   */
  off = <E extends keyof Events, T = Events[E]>(event: E, callback: T) => {
    const listeners = this.listeners[event] || [];
    this.listeners[event] = listeners.filter((cb) => cb !== callback);
  };

  /**
   * Dispatches a new event payload for the given event type.
   *
   * @param event the event.
   * @param payload the payload.
   */
  private dispatch = <E extends keyof Events, P = Parameters<Events[E]>[0]>(
    event: E,
    payload: P,
  ) => {
    const listeners = this.listeners[event] || [];
    for (const listener of listeners) {
      listener(payload);
    }
  };
}

/**
 * Checks if noise cancellation is currently enabled.
 * @returns Whether noise cancellation is enabled.
 */
export const isEnabled = (): boolean => {
  return NoiseCancellationReactNative.isEnabled();
};

/**
 * Enables or disables noise cancellation.
 * @param enabled - Whether to enable or disable noise cancellation.
 * @returns `true` when the enabled state has been updated.
 * @throws If the native processor has not been registered.
 */
export const setEnabled = (enabled: boolean): boolean => {
  return NoiseCancellationReactNative.setEnabled(enabled);
};

/**
 * Checks if the device supports advanced audio processing required for noise cancellation.
 * @returns Whether the device supports advanced audio processing.
 */
export const deviceSupportsAdvancedAudioProcessing = (): boolean => {
  return NoiseCancellationReactNative.deviceSupportsAdvancedAudioProcessing();
};
