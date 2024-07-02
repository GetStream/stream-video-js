/// <reference path="./krispai/krispsdk.d.ts" />
// RollupError: @rollup/plugin-typescript TS7016: Could not find a declaration file for module './krispai/krispsdk.mjs'
// @ts-ignore
import KrispSDK from './krispai/krispsdk.mjs';
import type {
  IAudioFilterNode,
  IKrispSDK,
  ISDKPartialOptions,
} from './krispai/krispsdk';
import { packageName, packageVersion } from './version';
import { promiseWithResolvers } from './withResolvers';
import { simd } from 'wasm-feature-detect';

/**
 * Options to pass to the NoiseCancellation instance.
 */
export type NoiseCancellationOptions = {
  /**
   * The base path to load the models from.
   * You can override this if you want to host the models yourself.
   * @default `https://unpkg.com/@stream-io/audio-filters-web@${packageVersion}/src/krispai/models`.
   */
  basePath?: string;

  /**
   * Optional Krisp SDK parameters.
   */
  krispSDKParams?: ISDKPartialOptions['params'];
};

/**
 * An interface for the NoiseCancellation implementation.
 * Provided for easier unit testing.
 */
export interface INoiseCancellation {
  isSupported: () => boolean | Promise<boolean>;
  init: () => Promise<void>;
  enable: () => void;
  disable: () => void;
  dispose: () => Promise<void>;
  toFilter: () => (mediaStream: MediaStream) => {
    output: MediaStream;
  };
  on: <E extends keyof Events, T = Events[E]>(
    event: E,
    callback: T,
  ) => () => void;
  off: <E extends keyof Events, T = Events[E]>(event: E, callback: T) => void;
}

/**
 * A list of events one can subscribe to.
 */
export type Events = {
  /**
   * Fires when Noise Cancellation state changes.
   *
   * @param enabled true when enabled, false otherwise.
   */
  change: (enabled: boolean) => void;
};

/**
 * A wrapper around the Krisp.AI SDK.
 */
export class NoiseCancellation implements INoiseCancellation {
  private sdk?: IKrispSDK;
  private filterNode?: IAudioFilterNode;
  private audioContext?: AudioContext;

  private readonly basePath: string;
  private readonly krispSDKParams?: ISDKPartialOptions['params'];

  private readonly listeners: Partial<Record<keyof Events, Array<any>>> = {};

  /**
   * Constructs a new instance.
   */
  constructor({
    basePath = `https://unpkg.com/${packageName}@${packageVersion}/src/krispai/models`,
    krispSDKParams,
  }: NoiseCancellationOptions = {}) {
    this.basePath = basePath;
    this.krispSDKParams = krispSDKParams;
  }

  /**
   * Checks if the noise cancellation is supported on this platform.
   * Make sure you call this method before trying to enable the noise cancellation.
   */
  isSupported = () => {
    if (!KrispSDK.isSupported()) {
      return false;
    } else {
      return simd();
    }
  };

  /**
   * Initializes the KrispAI SDK.
   *
   * Will throw in case the noise cancellation is not supported on this platform
   * or if the SDK is already initialized.
   */
  init = async () => {
    if (!(await this.isSupported())) {
      throw new Error('NoiseCancellation is not supported on this platform');
    }
    if (this.sdk) {
      throw new Error('NoiseCancellation is already initialized');
    }
    const sdk = new KrispSDK({
      params: {
        debugLogs: false,
        logProcessStats: false,
        useSharedArrayBuffer: false,
        models: {
          model8: `${this.basePath}/model_8.kw`,
          model16: `${this.basePath}/model_16.kw`,
          model32: `${this.basePath}/model_32.kw`,
        },
        ...this.krispSDKParams,
      },
    });
    await sdk.init();
    this.sdk = sdk;

    this.audioContext = new AudioContext();

    // AudioContext requires user interaction to start:
    // https://developer.chrome.com/blog/autoplay/#webaudio
    const resume = () => {
      // resume if still suspended
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume().catch((err) => {
          console.warn(
            'Failed to resume the audio context. Noise Cancellation may not work correctly',
            err,
          );
        });
      }
      document.removeEventListener('click', resume);
    };

    if (this.audioContext.state === 'suspended') {
      document.addEventListener('click', resume);
    }

    const { promise: ready, resolve: filterReady } = promiseWithResolvers();
    this.filterNode = await sdk.createNoiseFilter(
      this.audioContext,
      () => filterReady(),
      () => document.removeEventListener('click', resume),
    );
    return ready;
  };

  /**
   * Enables the noise cancellation.
   */
  enable = () => {
    if (!this.filterNode) return;
    this.filterNode.enable();
    this.dispatch('change', true);
  };

  /**
   * Disables the noise cancellation.
   */
  disable = () => {
    if (!this.filterNode) return;
    this.filterNode.disable();
    this.dispatch('change', false);
  };

  /**
   * Disposes the instance and releases all resources.
   */
  dispose = async () => {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close().catch((err) => {
        console.warn('Failed to close the audio context', err);
      });
      this.audioContext = undefined;
    }
    if (this.filterNode) {
      this.disable();
      this.filterNode.dispose();
      this.filterNode = undefined;
    }
    if (this.sdk) {
      this.sdk.dispose();
      this.sdk = undefined;
    }
  };

  /**
   * A utility method convenient for our Microphone filters API.
   */
  toFilter = () => (mediaStream: MediaStream) => {
    if (!this.filterNode || !this.audioContext) {
      throw new Error('NoiseCancellation is not initialized');
    }
    const source = this.audioContext.createMediaStreamSource(mediaStream);
    const destination = this.audioContext.createMediaStreamDestination();

    source.connect(this.filterNode).connect(destination);
    return { output: destination.stream };
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
