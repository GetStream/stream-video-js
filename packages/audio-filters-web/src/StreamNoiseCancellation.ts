import { packageName, packageVersion } from './version';
import { MODEL } from './stream/model';
import type { Tracer } from './tracer';
import {
  BaseNoiseCancellation,
  WARM_UP_GRACE_MS,
} from './BaseNoiseCancellation';
import { isWebKit } from './isWebKit';
import type { NoiseCancellationConfiguration } from './INoiseCancellation';

type ProcessorRuntime = typeof import('./stream/runtime');

let runtimePromise: Promise<ProcessorRuntime> | undefined;

/**
 * Loads the runtime (the worklet source and its loader) on first
 * use, so that it isn't part of the initial bundle.
 * A failed load isn't cached, so a later call can retry.
 */
const loadRuntime = () =>
  (runtimePromise ??= import('./stream/runtime').catch((err) => {
    runtimePromise = undefined;
    throw err;
  }));

/**
 * The only sample rate the model runs at.
 */
const SAMPLE_RATE = 48000;

/**
 * How far the processed path lags behind its input: the model's 512-sample
 * hop plus 384 samples of hop buffering in the worklet.
 * The dry path is delayed by the same amount, so blending the two
 * (suppression level below 100) doesn't comb-filter.
 */
const PROCESSING_DELAY_S = (512 + 384) / SAMPLE_RATE;

/**
 * How long `init()` may take in all: loading the runtime chunk, fetching the
 * model and loading the worklet. Each model request must get a response
 * within 10 s (see the runtime); this only bounds slow downloads, so that a
 * stalled init can't block cleanup forever.
 */
const INIT_TIMEOUT_MS = 60000;

/**
 * How long the worklet may take to reply `ready` while the audio context is
 * running. Time spent suspended (e.g., before a user gesture) doesn't count,
 * since the worklet may not run then.
 */
const WORKLET_READY_TIMEOUT_MS = 10000;

/**
 * The time constant of the gain ramps when the graph changes state.
 */
const GAIN_RAMP_TIME_CONSTANT_S = 0.015;

/**
 * How long the worklet may stay in its own passthrough while we want it to
 * filter, before it counts as an overload. The worklet needs at least
 * ~0.5 s of good probes to leave passthrough.
 */
const PASSTHROUGH_RECOVERY_MS = 3000;

/**
 * A minimal module that uses a v128 instruction: it validates only where
 * WebAssembly SIMD is supported, which the engine requires.
 */
const SIMD_TEST_MODULE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8,
  0, 65, 0, 253, 15, 253, 98, 11,
]);

const supportsWasmSimd = () => {
  try {
    return WebAssembly.validate(SIMD_TEST_MODULE);
  } catch {
    return false;
  }
};

/**
 * Options to pass to the StreamNoiseCancellation instance.
 */
export type StreamNoiseCancellationOptions = {
  /**
   * The base path to load the model from.
   * You can override this if you want to host the model yourself.
   * @default `https://unpkg.com/@stream-io/audio-filters-web@${packageVersion}/src/stream/models`.
   */
  basePath?: string;

  /**
   * Whether Safari and other WebKit browsers (all iOS browsers, WKWebView)
   * are reported as supported. Unlike Krisp, this engine supports them by
   * default. Set to false to opt out.
   * @default true
   */
  withSafariSupport?: boolean;

  /**
   * How long the filter stays off after an overload.
   * @default 15000
   */
  restoreTimeoutMs?: number;

  /**
   * Overloads after which the filter stays off.
   * @default 3
   */
  restoreAttempts?: number;
};

/**
 * Noise Cancellation based on Stream's own model (FastEnhancer architecture),
 * running in an AudioWorklet in a 48 kHz audio context. Adds about 19 ms of
 * latency while filtering.
 *
 * @experimental this provider and its model may change in any release.
 */
export class StreamNoiseCancellation extends BaseNoiseCancellation {
  readonly engine = 'stream';
  private workletNode?: AudioWorkletNode;
  private rawGain?: GainNode;
  private dryGain?: GainNode;
  private wetGain?: GainNode;
  private delayNode?: DelayNode;

  /** Whether the user wants the filter on. */
  private userEnabled = false;
  /** Whether the filter is held off after an overload. */
  private heldOff = false;
  /** Whether the filter is off after a `process_error`. */
  private failed = false;
  /** Whether the worklet stopped (`processorerror` or `destroyed`). */
  private workletDead = false;
  /**
   * Whether the last stream couldn't be connected to the graph, so raw audio
   * is published without the filter. Cleared by the next successful connect.
   */
  private streamFailed = false;
  /** Mirrors the worklet's `_autoPassthrough`, from `auto_bypass` messages. */
  private workletPassthrough = false;
  /** Whether the worklet replied `ready`, i.e., the model is loaded. */
  private workletReady = false;

  private level = 100;
  private overloadCount = 0;
  private processErrorCount = 0;
  private warmUpEndsAt?: number;
  private restoreTimeoutId?: number;
  private passthroughTimeoutId?: number;
  private readyTimeoutId?: number;
  /** Bumped by `dispose()`, so a pending `init()` can tell it is stale. */
  private generation = 0;
  /** Aborts the pending `init()` with the given cause; used by `dispose()`. */
  private abortInit?: (error: Error) => void;

  /**
   * The model build this instance runs.
   */
  readonly model = MODEL;
  private readonly basePath: string;
  private withSafariSupport: boolean;
  private readonly hasExplicitSafariSupport: boolean;
  private readonly restoreTimeoutMs: number;
  private readonly restoreAttempts: number;

  /**
   * Constructs a new instance.
   */
  constructor({
    basePath = `https://unpkg.com/${packageName}@${packageVersion}/src/stream/models`,
    withSafariSupport,
    restoreTimeoutMs = 15000,
    restoreAttempts = 3,
  }: StreamNoiseCancellationOptions = {}) {
    super();
    this.basePath = basePath;
    this.withSafariSupport = withSafariSupport ?? true;
    this.hasExplicitSafariSupport = typeof withSafariSupport !== 'undefined';
    this.restoreTimeoutMs = restoreTimeoutMs;
    this.restoreAttempts = restoreAttempts;
    // `init()` reports its failures to its caller; this keeps the shared
    // promise from surfacing as an unhandled rejection.
    this.initializing.catch(() => {});
  }

  /**
   * Applies options from the call settings. A `withSafariSupport` passed to
   * the constructor takes precedence. The model path is Krisp-only and is
   * ignored here. Call it before {@link isSupported} and {@link init}.
   */
  configure = (configuration: NoiseCancellationConfiguration) => {
    if (!this.hasExplicitSafariSupport) {
      this.withSafariSupport = configuration.withSafariSupport ?? true;
    }
  };

  /**
   * Checks if the noise cancellation is supported on this platform.
   * Make sure you call this method before trying to enable the noise cancellation.
   *
   * Requires AudioWorklet and WebAssembly SIMD. Safari and other
   * WebKit-based browsers are reported as supported unless
   * `withSafariSupport` is set to false.
   */
  isSupported = () => {
    if (isWebKit() && !this.withSafariSupport) return false;
    return (
      typeof AudioWorkletNode !== 'undefined' &&
      typeof WebAssembly !== 'undefined' &&
      supportsWasmSimd()
    );
  };

  /**
   * Creates the 48 kHz audio context and loads the worklet and the model.
   * Resolves once the model is handed to the worklet. The worklet loads it
   * when the audio context runs; until then, the audio passes through.
   *
   * Will throw in case the noise cancellation is not supported on this platform,
   * if it is already initialized, or if loading the model fails.
   */
  init = async (options: { tracer?: Tracer } = {}) => {
    if (!this.isSupported()) {
      throw new Error('NoiseCancellation is not supported on this platform');
    }
    if (this.audioContext) {
      throw new Error('NoiseCancellation is already initialized');
    }
    const generation = this.generation;
    this.tracer = options.tracer;

    // One deadline bounds the whole init. Aborting cancels the fetches;
    // `dispose()` aborts the same way. The cause is kept here rather than in
    // the abort reason APIs, which Safari < 15.4 lacks.
    const abortController = new AbortController();
    const { signal } = abortController;
    let abortError: Error | undefined;
    const abort = (error: Error) => {
      if (abortError) return;
      abortError = error;
      abortController.abort();
    };
    this.abortInit = abort;
    const deadlineId = window.setTimeout(() => {
      abort(
        new Error(
          `StreamNoiseCancellation did not initialize within ${INIT_TIMEOUT_MS} ms`,
        ),
      );
    }, INIT_TIMEOUT_MS);
    const aborted = new Promise<never>((_, reject) => {
      signal.addEventListener('abort', () => reject(abortError), {
        once: true,
      });
    });
    aborted.catch(() => {}); // raced below, and may settle after init
    // races steps that can't be aborted themselves
    const untilAborted = <T>(promise: Promise<T>) =>
      Promise.race([promise, aborted]);
    // stops a disposed or timed-out init after each await
    const assertCurrent = () => {
      if (generation !== this.generation) {
        throw new Error('NoiseCancellation was disposed while initializing');
      }
      if (abortError) throw abortError;
    };

    let workletNode: AudioWorkletNode | undefined;
    try {
      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      this.audioContext = audioContext;
      if (audioContext.sampleRate !== SAMPLE_RATE) {
        throw new Error(
          `the audio context runs at ${audioContext.sampleRate} Hz instead of ${SAMPLE_RATE} Hz`,
        );
      }
      this.startRecovery(audioContext);

      const { createProcessorNode } = await untilAborted(loadRuntime());
      assertCurrent();
      // The runtime honours `signal` in its fetches and returns no node once
      // aborted; the race also bounds `addModule`.
      workletNode = await untilAborted(
        createProcessorNode(audioContext, {
          basePath: this.basePath,
          signal,
        }),
      );
      assertCurrent();

      const delayNode = audioContext.createDelay(PROCESSING_DELAY_S);
      delayNode.delayTime.value = PROCESSING_DELAY_S;
      const rawGain = audioContext.createGain();
      const dryGain = audioContext.createGain();
      const wetGain = audioContext.createGain();
      rawGain.gain.value = 1;
      dryGain.gain.value = 0;
      wetGain.gain.value = 0;
      delayNode.connect(dryGain);
      workletNode.connect(wetGain);

      // `ready` and `error` replies queued until the port starts
      workletNode.port.addEventListener('message', this.handlePortMessage);
      workletNode.port.start();
      workletNode.onprocessorerror = this.handleProcessorError;
      audioContext.addEventListener('statechange', this.updateReadyTimeout);

      this.workletNode = workletNode;
      this.delayNode = delayNode;
      this.rawGain = rawGain;
      this.dryGain = dryGain;
      this.wetGain = wetGain;
      this.updateReadyTimeout();
    } catch (err) {
      // an aborted step fails with a generic error, report the cause instead
      const error = abortError ?? err;
      const message = error instanceof Error ? error.message : String(error);
      this.tracer?.trace('noiseCancellation.error', message);
      if (generation === this.generation) {
        await this.teardown();
      } else if (workletNode) {
        // disposed meanwhile: only release what this call created
        workletNode.port.postMessage({ type: 'destroy' });
        workletNode.disconnect();
        workletNode.port.close();
      }
      this.rejectInitialized(error);
      throw error;
    } finally {
      window.clearTimeout(deadlineId);
      if (this.abortInit === abort) this.abortInit = undefined;
    }

    this.resolveInitialized();
    // apply an `enable()` that came before the init completed
    if (this.userEnabled) this.transition(() => {}, true);
  };

  /**
   * Checks if the noise cancellation is enabled.
   * `false` before the init completes, and while the filter is held off
   * after an overload or an error.
   */
  isEnabled = async () => !!this.workletNode && this.isFiltering();

  /**
   * Enables the noise cancellation.
   * Also re-enables it after an overload or a single processing error.
   *
   * Always notifies the `change` listeners, even if the filtering state
   * didn't flip, so that a caller re-enabling it (e.g., after a reconnect)
   * re-announces the state.
   * Called before the init completes, it is applied once it does.
   */
  enable = async () => {
    if (!this.workletNode) {
      this.userEnabled = true;
      return;
    }
    this.clearRestore();
    if (this.workletReady) {
      this.warmUpEndsAt ??= performance.now() + WARM_UP_GRACE_MS;
    }
    this.transition(() => {
      this.userEnabled = true;
      this.heldOff = false;
      // a single processing error may be retried, a repeated one is final
      if (this.processErrorCount < 2) this.failed = false;
    }, true);
    const reason = this.workletDead
      ? 'worklet stopped'
      : this.failed
        ? 'repeated process_error'
        : this.streamFailed
          ? 'stream not connected'
          : undefined;
    if (reason) {
      this.tracer?.trace(
        'noiseCancellation.error',
        `enable ignored: ${reason}`,
      );
    }
  };

  /**
   * Disables the noise cancellation.
   * Always notifies the `change` listeners, like `enable()`.
   */
  disable = async () => {
    if (!this.workletNode) {
      this.userEnabled = false;
      return;
    }
    this.clearRestore();
    this.transition(() => {
      this.userEnabled = false;
      this.heldOff = false;
    }, true);
  };

  /**
   * Disposes the instance and releases all resources.
   */
  dispose = async () => {
    this.generation++;
    this.abortInit?.(
      new Error('NoiseCancellation was disposed while initializing'),
    );
    this.abortInit = undefined;
    await this.disable();
    await this.teardown();
  };

  /**
   * Sets the noise suppression level (0-100): the share of filtered audio
   * in a blend with the original audio.
   *
   * @param level 0 for no suppression, 100 for maximum suppression.
   */
  setSuppressionLevel = (level: number) => {
    if (level < 0 || level > 100) {
      throw new Error('NoiseCancellation level must be between 0 and 100');
    }
    this.level = level;
    this.applyState();
  };

  /**
   * A utility method convenient for our Microphone filters API.
   *
   * Same as the base implementation, except that it fails with a descriptive
   * error when the stream can't be connected to the 48 kHz audio context
   * (e.g., a browser that can't resample it), before building any graph.
   */
  toFilter = () => (mediaStream: MediaStream) => {
    const { audioContext } = this;
    if (!audioContext) {
      throw new Error('NoiseCancellation is not initialized');
    }

    const [audioTrack] = mediaStream.getAudioTracks();
    if (!audioTrack) throw new Error('No audio track found in the stream');

    let source: MediaStreamAudioSourceNode;
    try {
      source = audioContext.createMediaStreamSource(mediaStream);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const trackRate = audioTrack.getSettings().sampleRate ?? 'unknown';
      this.handleStreamFailed(`toFilter ${message}`);
      throw new Error(
        `StreamNoiseCancellation can't connect the stream (${trackRate} Hz)` +
          ` to its ${SAMPLE_RATE} Hz audio context: ${message}`,
        { cause: err },
      );
    }
    const destination = audioContext.createMediaStreamDestination();
    destination.channelCount = audioTrack.getSettings().channelCount ?? 1;

    const stop = this.connectFilter(source, destination);

    return { output: destination.stream, stop };
  };

  /**
   * Connects the source to the raw, delayed dry and filtered paths,
   * all summed into the destination. The gains decide which one is heard.
   * A successful connect clears an earlier stream failure.
   *
   * Returns a cleanup that detaches this source and destination only, so a
   * re-applied filter chain doesn't leave the previous stream mixed in.
   */
  protected connectFilter = (
    source: MediaStreamAudioSourceNode,
    destination: MediaStreamAudioDestinationNode,
  ) => {
    const { workletNode, delayNode, rawGain, dryGain, wetGain } = this;
    if (!workletNode || !delayNode || !rawGain || !dryGain || !wetGain) {
      throw new Error('NoiseCancellation is not initialized');
    }
    try {
      source.connect(rawGain);
      source.connect(delayNode);
      source.connect(workletNode);
      rawGain.connect(destination);
      dryGain.connect(destination);
      wetGain.connect(destination);
    } catch (err) {
      source.disconnect();
      const message = err instanceof Error ? err.message : String(err);
      this.handleStreamFailed(`connectFilter ${message}`);
      throw err;
    }
    this.transition(() => {
      this.streamFailed = false;
    });
    return () => {
      // the nodes may already be disconnected by `dispose()`
      const detach = (node: AudioNode, target?: AudioNode) => {
        try {
          if (target) node.disconnect(target);
          else node.disconnect();
        } catch {
          // not connected
        }
      };
      detach(source);
      detach(rawGain, destination);
      detach(dryGain, destination);
      detach(wetGain, destination);
    };
  };

  /**
   * Whether the filter should be audible: wanted by the user and not held
   * off, failed, dead or without a connected stream.
   */
  private isFiltering = () =>
    this.userEnabled &&
    !this.heldOff &&
    !this.failed &&
    !this.workletDead &&
    !this.streamFailed;

  /**
   * Applies a state change, updates the graph, and fires `change`
   * when the filtering state flips, or always when `notify` is set.
   * Internal transitions (overload, restore, errors) notify on flips only,
   * so the state doesn't flap.
   */
  private transition = (update: () => void, notify = false) => {
    const wasFiltering = this.isFiltering();
    update();
    this.applyState();
    const filtering = this.isFiltering();
    if (notify || filtering !== wasFiltering) {
      this.dispatch('change', filtering);
    }
  };

  /**
   * Sets the gains and the worklet bypass from the current state.
   *
   * - Filtering: raw 0, dry 1 - level, wet level, worklet bypass off.
   * - Off: raw 1, dry 0, wet 0, worklet bypass on (saves CPU).
   * - Filtering while the worklet is in its own passthrough, or hasn't
   *   loaded the model yet: raw 1, dry 0, wet 0, worklet bypass off, so that
   *   its probes can bring it back, or it starts filtering once ready.
   */
  private applyState = () => {
    const { audioContext, workletNode, rawGain, dryGain, wetGain } = this;
    if (!audioContext || !workletNode || !rawGain || !dryGain || !wetGain) {
      return;
    }
    const filtering = this.isFiltering();
    const audible = filtering && this.workletReady && !this.workletPassthrough;
    const wet = audible ? this.level / 100 : 0;
    const now = audioContext.currentTime;
    const tc = GAIN_RAMP_TIME_CONSTANT_S;
    rawGain.gain.setTargetAtTime(audible ? 0 : 1, now, tc);
    dryGain.gain.setTargetAtTime(audible ? 1 - wet : 0, now, tc);
    wetGain.gain.setTargetAtTime(wet, now, tc);
    workletNode.port.postMessage({ type: 'set_bypass', enabled: !filtering });

    if (filtering && this.workletPassthrough) {
      this.passthroughTimeoutId ??= window.setTimeout(
        this.handlePassthroughTimeout,
        PASSTHROUGH_RECOVERY_MS,
      );
    } else {
      this.clearPassthroughTimeout();
    }
  };

  private handlePortMessage = (e: MessageEvent) => {
    const data = e.data;
    switch (data?.type) {
      case 'ready':
        this.handleWorkletReady();
        break;
      case 'error':
        this.handleWorkletStopped(
          `worklet init error ${String(data.message ?? 'unknown error')}`,
        );
        break;
      case 'auto_bypass':
        this.handleAutoBypass(!!data.enabled);
        break;
      case 'process_error':
        this.handleProcessError(String(data.message ?? 'unknown error'));
        break;
      case 'destroyed':
        // our own dispose() unsubscribes before destroying the worklet
        this.handleWorkletStopped('worklet destroyed');
        break;
    }
  };

  /**
   * The worklet loaded the model: start filtering if it is wanted.
   */
  private handleWorkletReady = () => {
    if (this.workletReady) return;
    this.workletReady = true;
    this.clearReadyTimeout();
    this.tracer?.trace('noiseCancellation.started', 'true');
    if (this.isFiltering()) {
      this.warmUpEndsAt ??= performance.now() + WARM_UP_GRACE_MS;
    }
    this.applyState();
  };

  /**
   * Runs the `ready` deadline only while the audio context runs, since the
   * worklet may not run (and reply) while the context is suspended.
   */
  private updateReadyTimeout = () => {
    const { audioContext } = this;
    if (
      !audioContext ||
      !this.workletNode ||
      this.workletReady ||
      this.workletDead ||
      audioContext.state !== 'running'
    ) {
      this.clearReadyTimeout();
      return;
    }
    this.readyTimeoutId ??= window.setTimeout(() => {
      this.readyTimeoutId = undefined;
      this.handleWorkletStopped(
        `worklet not ready within ${WORKLET_READY_TIMEOUT_MS} ms`,
      );
    }, WORKLET_READY_TIMEOUT_MS);
  };

  private clearReadyTimeout = () => {
    window.clearTimeout(this.readyTimeoutId);
    this.readyTimeoutId = undefined;
  };

  /**
   * Handles the worklet entering or leaving its own passthrough.
   *
   * The worklet sends one message per transition. `set_bypass` doesn't clear
   * its passthrough, so its state is mirrored here and a restore resumes
   * with it.
   */
  private handleAutoBypass = (enabled: boolean) => {
    this.tracer?.trace('noiseCancellation.autoBypass', String(enabled));
    this.workletPassthrough = enabled;
    if (enabled && this.isFiltering()) {
      const now = performance.now();
      if (this.warmUpEndsAt !== undefined && now < this.warmUpEndsAt) {
        this.tracer?.trace(
          'noiseCancellation.bufferOverflowIgnored',
          'warm-up',
        );
        // The passthrough deadline (armed by applyState below) applies here
        // too, on purpose: otherwise a device that never recovers would sit
        // "enabled" on raw audio forever.
      } else {
        this.handleOverload();
        return;
      }
    }
    // auto_bypass(false) while held off only updates the mirrored state
    this.applyState();
  };

  /**
   * The worklet didn't leave its passthrough in time while we wanted it to
   * filter (after a warm-up overload, or a restore), so it is overloaded.
   */
  private handlePassthroughTimeout = () => {
    this.passthroughTimeoutId = undefined;
    if (!this.isFiltering() || !this.workletPassthrough) return;
    this.tracer?.trace('noiseCancellation.autoBypass', 'no-recovery');
    this.handleOverload();
  };

  /**
   * Holds the filter off after an overload, and schedules a restore while
   * under the `restoreAttempts` cap.
   */
  private handleOverload = () => {
    this.overloadCount++;
    const willRestore = this.overloadCount < this.restoreAttempts;
    this.clearRestore();
    if (willRestore) {
      this.restoreTimeoutId = window.setTimeout(
        this.restore,
        this.restoreTimeoutMs,
      );
    }
    this.transition(() => {
      this.heldOff = true;
    });
    this.dispatch('overload', {
      willRestore,
      overflowCount: this.overloadCount,
      restoreInMs: willRestore ? this.restoreTimeoutMs : undefined,
    });
  };

  private restore = () => {
    this.restoreTimeoutId = undefined;
    this.transition(() => {
      this.heldOff = false;
    });
  };

  /**
   * The worklet threw while processing a frame and passed it through.
   * The first one turns the filter off until the next `enable()`,
   * a second one turns it off until `dispose()`.
   */
  private handleProcessError = (message: string) => {
    this.tracer?.trace('noiseCancellation.error', `process_error ${message}`);
    // errors still in flight after we turned the filter off
    if (!this.isFiltering()) return;
    this.processErrorCount++;
    this.transition(() => {
      this.failed = true;
    });
  };

  private handleProcessorError = () => {
    this.handleWorkletStopped('processorerror');
  };

  /**
   * The worklet stopped and outputs silence: switch to the raw path for good.
   */
  private handleWorkletStopped = (reason: string) => {
    this.tracer?.trace('noiseCancellation.error', reason);
    this.clearRestore();
    this.clearReadyTimeout();
    this.transition(() => {
      this.workletDead = true;
    });
  };

  /**
   * The stream couldn't be connected to the graph and is published raw:
   * the filter counts as off until a stream connects.
   */
  private handleStreamFailed = (reason: string) => {
    this.tracer?.trace('noiseCancellation.error', reason);
    this.transition(() => {
      this.streamFailed = true;
    });
  };

  private clearRestore = () => {
    window.clearTimeout(this.restoreTimeoutId);
    this.restoreTimeoutId = undefined;
  };

  private clearPassthroughTimeout = () => {
    window.clearTimeout(this.passthroughTimeoutId);
    this.passthroughTimeoutId = undefined;
  };

  /**
   * Releases the worklet, the graph, the recovery and the audio context,
   * and resets the state.
   */
  private teardown = async () => {
    this.clearRestore();
    this.clearPassthroughTimeout();
    this.clearReadyTimeout();
    this.stopRecovery();
    this.audioContext?.removeEventListener(
      'statechange',
      this.updateReadyTimeout,
    );

    const { workletNode } = this;
    if (workletNode) {
      workletNode.port.removeEventListener('message', this.handlePortMessage);
      workletNode.onprocessorerror = null;
      workletNode.port.postMessage({ type: 'destroy' });
      workletNode.port.close();
    }
    for (const node of [
      workletNode,
      this.delayNode,
      this.rawGain,
      this.dryGain,
      this.wetGain,
    ]) {
      node?.disconnect();
    }
    this.workletNode = undefined;
    this.delayNode = undefined;
    this.rawGain = undefined;
    this.dryGain = undefined;
    this.wetGain = undefined;

    this.userEnabled = false;
    this.heldOff = false;
    this.failed = false;
    this.workletDead = false;
    this.streamFailed = false;
    this.workletPassthrough = false;
    this.workletReady = false;
    this.overloadCount = 0;
    this.processErrorCount = 0;
    this.warmUpEndsAt = undefined;

    const { audioContext } = this;
    this.audioContext = undefined;
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close().catch((err) => {
        console.warn('Failed to close the audio context', err);
      });
    }
  };
}
