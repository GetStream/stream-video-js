// RollupError: @rollup/plugin-typescript TS7016: Could not find a declaration file for module './krispai/krispsdk.mjs'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - issues with typescript on CI
import KrispSDK from './krispai/krispsdk.mjs';
import type {
  IAudioFilterNode,
  IKrispSDK,
  ISDKPartialOptions,
} from './krispai/krispsdk';
import { packageName, packageVersion } from './version';
import { promiseWithResolvers } from './withResolvers';
import { simd } from 'wasm-feature-detect';
import type { Tracer } from './tracer';

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
   * When Krisp SDK detects buffer overflow, it will disable the filter and
   * wait for this timeout before enabling it again.
   * Defaults to 15000 ms.
   */
  restoreTimeoutMs?: number;

  /**
   * The number of attempts to restore the filter after a buffer overflow.
   * Defaults to 3.
   */
  restoreAttempts?: number;

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
  init: (options?: { tracer?: Tracer }) => Promise<void>;
  isEnabled: () => Promise<boolean>;
  canAutoEnable?: () => Promise<boolean>;
  enable: () => void;
  disable: () => void;
  dispose: () => Promise<void>;
  resume: () => void;
  setSuppressionLevel: (level: number) => void;
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
  private restoreTimeoutId?: number;
  private tracer?: Tracer;

  private readonly basePath: string;
  private readonly restoreTimeoutMs: number;
  private readonly restoreAttempts: number;
  private readonly krispSDKParams?: ISDKPartialOptions['params'];

  private readonly listeners: Partial<Record<keyof Events, Array<any>>> = {};

  /**
   * Constructs a new instance.
   */
  constructor({
    basePath = `https://unpkg.com/${packageName}@${packageVersion}/src/krispai/models`,
    restoreTimeoutMs = 15000,
    restoreAttempts = 3,
    krispSDKParams,
  }: NoiseCancellationOptions = {}) {
    this.basePath = basePath;
    this.restoreTimeoutMs = restoreTimeoutMs;
    this.restoreAttempts = restoreAttempts;
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
  init = async (options: { tracer?: Tracer } = {}) => {
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
          // https://sdk-docs.krisp.ai/docs/krisp-audio-sdk-model-selection-guide
          modelNC: `${this.basePath}/c6.f.s.da1785.kef`,
        },
        ...this.krispSDKParams,
      },
    });
    await sdk.init();
    this.sdk = sdk;
    this.tracer = options.tracer;

    const audioContext = new AudioContext();
    this.audioContext = audioContext;

    this.tracer?.trace(
      'noiseCancellation.audioContextState',
      audioContext.state,
    );

    this.audioContext.addEventListener('statechange', () => {
      this.tracer?.trace(
        'noiseCancellation.audioContextState',
        audioContext.state,
      );
    });

    // AudioContext requires user interaction to start:
    // https://developer.chrome.com/blog/autoplay/#webaudio
    const resume = () => {
      this.resume();
      document.removeEventListener('click', resume);
    };

    if (this.audioContext.state === 'suspended') {
      document.addEventListener('click', resume);
    }

    const { promise: ready, resolve: filterReady } = promiseWithResolvers();
    const filterNode = await sdk.createNoiseFilter(
      this.audioContext,
      () => {
        this.tracer?.trace('noiseCancellation.started', 'true');
        filterReady();
      },
      () => document.removeEventListener('click', resume),
    );
    filterNode.addEventListener('buffer_overflow', this.handleBufferOverflow);
    this.filterNode = filterNode;
    return ready;
  };

  /**
   * Checks if the noise cancellation is enabled.
   */
  isEnabled = async () => {
    if (!this.filterNode) return false;
    return this.filterNode.isEnabled();
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
    window.clearTimeout(this.restoreTimeoutId);
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close().catch((err) => {
        console.warn('Failed to close the audio context', err);
      });
      this.audioContext = undefined;
    }
    if (this.filterNode) {
      this.disable();
      this.filterNode.removeEventListener(
        'buffer_overflow',
        this.handleBufferOverflow,
      );
      this.filterNode.dispose();
      this.filterNode = undefined;
    }
    if (this.sdk) {
      this.sdk.dispose();
      this.sdk = undefined;
    }
  };

  /**
   * Sets the noise suppression level (0-100).
   *
   * @param level 0 for no suppression, 100 for maximum suppression.
   */
  setSuppressionLevel = (level: number) => {
    // @ts-expect-error not yet in the types, but exists in the implementation
    if (!this.filterNode || !this.filterNode.setNoiseSuppressionLevel) {
      throw new Error(
        'NoiseCancellation is not initialized with a filter node that supports noise suppression level',
      );
    }
    if (level < 0 || level > 100) {
      throw new Error('NoiseCancellation level must be between 0 and 100');
    }
    // @ts-expect-error not yet in the types, but exists in the implementation
    this.filterNode.setNoiseSuppressionLevel(level);
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
    // When filter is started, user's microphone media stream is active.
    // That means that most probably we can resume audio context without
    // any autoplay policy limitations.
    this.resume();
    return { output: destination.stream };
  };

  resume = () => {
    // resume if still suspended
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().catch((err) => {
        console.warn(
          'Failed to resume the audio context. Noise Cancellation may not work correctly',
          err,
        );
      });
    }
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

  /**
   * Handles the buffer overflow event.
   * Disables the filter and waits for the restore timeout before enabling it again.
   *
   * Based on: https://sdk-docs.krisp.ai/docs/getting-started-js#system-overload-handling
   */
  private handleBufferOverflow = (
    // extending the Event type to include the data property as it is not yet
    // in the types but exists in the implementation
    e: Event & { data?: { overflowCount: number } },
  ) => {
    const count = (e && e.data && e.data.overflowCount) ?? 0;
    this.tracer?.trace('noiseCancellation.bufferOverflowCount', String(count));

    window.clearTimeout(this.restoreTimeoutId);
    this.disable();

    if (count < this.restoreAttempts) {
      this.restoreTimeoutId = window.setTimeout(() => {
        this.enable();
      }, this.restoreTimeoutMs);
    }
  };
}
