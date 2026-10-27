import KrispSDK from './krispai';
import type {
  IAudioFilterNode,
  IKrispSDK,
  ISDKPartialOptions,
} from './krispai';
import { AudioContextRecovery } from './AudioContextRecovery';
import { packageName, packageVersion } from './version';
import { promiseWithResolvers } from './withResolvers';
import { simd } from 'wasm-feature-detect';
import type { Tracer } from './tracer';

/**
 * Krisp stalls once shortly after its first frames are processed (seen in
 * Safari about 1s after the first enable) and drops the backlog on its own.
 * Overflows reported within this window after the first enable are ignored.
 */
const WARM_UP_GRACE_MS = 3000;

/**
 * Krisp reports a single stall as a burst of overflow events.
 * Overflows within this window after a handled one count as the same overload.
 */
const OVERLOAD_DEBOUNCE_MS = 1000;

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
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  dispose: () => Promise<void>;
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
 * The payload of the `overload` event.
 */
export type NoiseCancellationOverloadEvent = {
  /**
   * `true` when Noise Cancellation will be turned back on automatically
   * after `restoreInMs`, `false` when it stays off.
   */
  willRestore: boolean;
  /**
   * The number of overloads detected so far.
   */
  overflowCount: number;
  /**
   * The delay before Noise Cancellation is turned back on.
   * Set only when `willRestore` is `true`.
   */
  restoreInMs?: number;
};

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

  /**
   * Fires when Noise Cancellation is turned off automatically because
   * the device can't keep up with the audio processing (CPU overload).
   * Fires after the corresponding `change` event.
   *
   * @param event the overload details.
   */
  overload: (event: NoiseCancellationOverloadEvent) => void;
};

/**
 * A wrapper around the Krisp.AI SDK.
 */
export class NoiseCancellation implements INoiseCancellation {
  private sdk?: IKrispSDK;
  private filterNode?: IAudioFilterNode;
  private audioContext?: AudioContext;
  private recovery?: AudioContextRecovery;
  private restoreTimeoutId?: number;
  private tracer?: Tracer;
  private overloadCount = 0;
  private lastOverloadAt = -Infinity;
  private warmUpEndsAt?: number;

  private readonly initializing: Promise<void>;
  private readonly resolveInitialized!: () => void;
  private readonly rejectInitialized!: (reason?: unknown) => void;

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
    const { promise, resolve, reject } = promiseWithResolvers<void>();
    this.initializing = promise;
    this.resolveInitialized = resolve;
    this.rejectInitialized = reject;

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
          modelNC: `${this.basePath}/krisp-nc-o-med-v7.kef`,
        },
        ...this.krispSDKParams,
      },
    });
    await sdk.init();
    this.sdk = sdk;
    this.tracer = options.tracer;

    const audioContext = new AudioContext();
    this.audioContext = audioContext;

    this.recovery = new AudioContextRecovery({
      audioContext,
      tracer: this.tracer,
    });

    const filterNode = await sdk.createNoiseFilter(
      this.audioContext,
      () => {
        this.tracer?.trace('noiseCancellation.started', 'true');
        this.resolveInitialized();
      },
      this.handleUnexpectedDispose,
    );
    filterNode.addEventListener('buffer_overflow', this.handleBufferOverflow);
    filterNode.addEventListener('error', this.handleError);
    this.filterNode = filterNode;

    return this.initializing;
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
  enable = async () => {
    window.clearTimeout(this.restoreTimeoutId);
    await this.setFilterEnabled(true);
  };

  /**
   * Disables the noise cancellation.
   */
  disable = async () => {
    window.clearTimeout(this.restoreTimeoutId);
    await this.setFilterEnabled(false);
  };

  /**
   * Disposes the instance and releases all resources.
   */
  dispose = async () => {
    window.clearTimeout(this.restoreTimeoutId);
    if (this.recovery) {
      this.recovery.dispose();
      this.recovery = undefined;
    }
    if (this.filterNode) {
      await this.disable().catch((err) =>
        console.warn('Failed to disable noise cancellation on dispose', err),
      );
      this.filterNode.removeEventListener('error', this.handleError);
      this.filterNode.removeEventListener(
        'dispose',
        this.handleUnexpectedDispose,
      );
      this.filterNode.removeEventListener(
        'buffer_overflow',
        this.handleBufferOverflow,
      );
      this.filterNode.dispose();
      this.filterNode = undefined;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close().catch((err) => {
        console.warn('Failed to close the audio context', err);
      });
      this.audioContext = undefined;
    }
    if (this.sdk) {
      this.sdk.dispose();
      this.sdk = undefined;
    }
    this.overloadCount = 0;
    this.lastOverloadAt = -Infinity;
    this.warmUpEndsAt = undefined;
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

    const [audioTrack] = mediaStream.getAudioTracks();
    if (!audioTrack) throw new Error('No audio track found in the stream');

    const source = this.audioContext.createMediaStreamSource(mediaStream);
    const destination = this.audioContext.createMediaStreamDestination();
    destination.channelCount = audioTrack.getSettings().channelCount ?? 1;

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
   * Toggles the filter and notifies the `change` listeners.
   * Unlike `enable()` and `disable()`, it keeps a pending restore scheduled.
   */
  private setFilterEnabled = async (enabled: boolean) => {
    if (!this.filterNode) return;
    await this.initializing;

    if (enabled) {
      this.warmUpEndsAt ??= performance.now() + WARM_UP_GRACE_MS;
      this.filterNode.enable();
    } else {
      this.filterNode.disable();
    }
    this.dispatch('change', enabled);
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
   * Traces errors reported by the Krisp SDK.
   *
   * The SDK surfaces model fetch/load, unsupported sample-rate and WASM/session
   * init failures (`MODEL_URL_FETCH_ERROR`, `MODEL_LOAD_ERROR`,
   * `SAMPLING_RATE_NOT_SUPPORTED`, `NC_SESSION_INIT_ERROR`,
   * `AR_SESSION_INIT_ERROR`, `WASM_INIT_ERROR`) via an `error` event on the
   * filter node, separately from the `ready` callback.
   * We record them for diagnostics.
   */
  private handleError = (
    e: Event & { data?: { errorCode?: string; errorMessage?: string } },
  ) => {
    const code = (e && e.data && e.data.errorCode) || 'UNKNOWN';
    const message = (e && e.data && e.data.errorMessage) || '';
    this.tracer?.trace('noiseCancellation.error', `${code} ${message}`.trim());
    this.rejectInitialized(
      new Error(
        `NoiseCancellation failed to initialize: ${code} ${message}`.trim(),
      ),
    );
  };

  /**
   * Handles a `dispose` of the filter node that we didn't initiate.
   *
   * Since 2.3.10, the Krisp SDK disposes the filter node on its own when its
   * web worker fails to start (e.g., a CSP that blocks `blob:` workers). This
   * happens after `createNoiseFilter` has resolved, and `dispose` is the only
   * signal we get, so without this `init()` would never settle.
   * Our own `dispose()` unregisters this handler before disposing the node.
   */
  private handleUnexpectedDispose = () => {
    this.tracer?.trace('noiseCancellation.error', 'FILTER_NODE_DISPOSED');
    this.rejectInitialized(
      new Error(
        'NoiseCancellation failed to initialize: FILTER_NODE_DISPOSED the filter was disposed before it became ready',
      ),
    );
  };

  /**
   * Handles the buffer overflow event.
   * Disables the filter and waits for the restore timeout before enabling it again.
   * Notifies the `overload` listeners once the filter is disabled.
   * Overflows during the warm-up window, or within the same burst, are ignored.
   *
   * Based on: https://sdk-docs.krisp.ai/docs/getting-started-js#system-overload-handling
   */
  private handleBufferOverflow = (
    // extending the Event type to include the data property as it is not yet
    // in the types but exists in the implementation
    e: Event & {
      data?: {
        overflowCount?: number;
        isBufferDropped?: boolean;
      };
    },
  ) => {
    const count = (e && e.data && e.data.overflowCount) ?? 0;
    const isBufferDropped = (e && e.data && e.data.isBufferDropped) ?? false;

    this.tracer?.trace('noiseCancellation.bufferOverflowCount', String(count));
    if (isBufferDropped) {
      this.tracer?.trace('noiseCancellation.bufferDropped', 'true');
    }

    const now = performance.now();
    if (this.warmUpEndsAt !== undefined && now < this.warmUpEndsAt) {
      this.tracer?.trace('noiseCancellation.bufferOverflowIgnored', 'warm-up');
      return;
    }
    if (now - this.lastOverloadAt < OVERLOAD_DEBOUNCE_MS) {
      this.tracer?.trace('noiseCancellation.bufferOverflowIgnored', 'burst');
      return;
    }
    this.lastOverloadAt = now;
    this.overloadCount++;

    const willRestore = this.overloadCount < this.restoreAttempts;
    window.clearTimeout(this.restoreTimeoutId);
    if (willRestore) {
      this.restoreTimeoutId = window.setTimeout(() => {
        this.setFilterEnabled(true).catch((err) =>
          console.error('Failed to enable noise cancellation ', err),
        );
      }, this.restoreTimeoutMs);
    }

    this.setFilterEnabled(false)
      .then(() => {
        this.dispatch('overload', {
          willRestore,
          overflowCount: this.overloadCount,
          restoreInMs: willRestore ? this.restoreTimeoutMs : undefined,
        });
      })
      .catch((err) =>
        console.error('Failed to disable noise cancellation ', err),
      );
  };
}
