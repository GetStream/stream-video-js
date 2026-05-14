import { ScopedLogger, videoLoggerSystem } from '../logger';
import type { CallEventListener } from '../coordinator/connection/types';
import { CallingState, CallState } from '../store';
import { createSafeAsyncSubscription } from '../store/rxUtils';
import {
  ErrorCode,
  PeerType,
  TrackType,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';
import { NegotiationError } from './NegotiationError';
import { StreamSfuClient } from '../StreamSfuClient';
import { AllSfuEvents, Dispatcher } from './Dispatcher';
import { withoutConcurrency } from '../helpers/concurrency';
import { StatsTracer, Tracer, traceRTCPeerConnection } from '../stats';
import {
  BasePeerConnectionOpts,
  OnIceConnected,
  OnReconnectionNeeded,
  ReconnectReason,
} from './types';
import type { ClientPublishOptions } from '../types';

/**
 * A base class for the `Publisher` and `Subscriber` classes.
 * @internal
 */
export abstract class BasePeerConnection {
  protected readonly logger: ScopedLogger;
  protected readonly peerType: PeerType;
  protected readonly pc: RTCPeerConnection;
  protected readonly state: CallState;
  protected readonly dispatcher: Dispatcher;
  protected readonly clientPublishOptions?: ClientPublishOptions;
  protected tag: string;
  protected sfuClient: StreamSfuClient;

  private onReconnectionNeeded?: OnReconnectionNeeded;
  private onIceConnected?: OnIceConnected;
  private readonly iceRestartDelay: number;
  private iceHasEverConnected = false;
  private iceRestartTimeout?: NodeJS.Timeout;
  private preConnectStuckTimeout?: NodeJS.Timeout;
  protected isIceRestarting = false;
  protected isDisposed = false;

  protected trackIdToTrackType = new Map<string, TrackType>();

  readonly tracer?: Tracer;
  readonly stats: StatsTracer;

  private subscriptions: (() => void)[] = [];
  private unsubscribeIceTrickle?: () => void;
  protected readonly lock = Math.random().toString(36).slice(2);

  /**
   * Constructs a new `BasePeerConnection` instance.
   */
  protected constructor(
    peerType: PeerType,
    {
      sfuClient,
      connectionConfig,
      state,
      dispatcher,
      onReconnectionNeeded,
      onIceConnected,
      tag,
      enableTracing,
      clientPublishOptions,
      iceRestartDelay = 2500,
    }: BasePeerConnectionOpts,
  ) {
    this.peerType = peerType;
    this.sfuClient = sfuClient;
    this.state = state;
    this.dispatcher = dispatcher;
    this.iceRestartDelay = iceRestartDelay;
    this.clientPublishOptions = clientPublishOptions;
    this.tag = tag;
    this.onReconnectionNeeded = onReconnectionNeeded;
    this.onIceConnected = onIceConnected;
    this.logger = videoLoggerSystem.getLogger(
      peerType === PeerType.SUBSCRIBER ? 'Subscriber' : 'Publisher',
      { tags: [tag] },
    );
    this.pc = this.createPeerConnection(connectionConfig);
    this.stats = new StatsTracer(this.pc, peerType, this.trackIdToTrackType);
    if (enableTracing) {
      this.tracer = new Tracer(
        `${tag}-${peerType === PeerType.SUBSCRIBER ? 'sub' : 'pub'}`,
      );
      this.tracer.trace('create', {
        url: sfuClient.edgeName,
        ...connectionConfig,
      });
      traceRTCPeerConnection(this.pc, this.tracer.trace);
    }
  }

  private createPeerConnection = (connectionConfig?: RTCConfiguration) => {
    const pc = new RTCPeerConnection(connectionConfig);
    pc.addEventListener('icecandidate', this.onIceCandidate);
    pc.addEventListener('icecandidateerror', this.onIceCandidateError);
    pc.addEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    pc.addEventListener('icegatheringstatechange', this.onIceGatherChange);
    pc.addEventListener('signalingstatechange', this.onSignalingChange);
    pc.addEventListener('connectionstatechange', this.onConnectionStateChange);
    return pc;
  };

  /**
   * Disposes the `RTCPeerConnection` instance.
   */
  dispose() {
    clearTimeout(this.iceRestartTimeout);
    this.iceRestartTimeout = undefined;
    clearTimeout(this.preConnectStuckTimeout);
    this.preConnectStuckTimeout = undefined;
    this.onReconnectionNeeded = undefined;
    this.onIceConnected = undefined;
    this.isDisposed = true;
    this.detachEventHandlers();
    this.pc.close();
    this.tracer?.dispose();
  }

  /**
   * Detaches the event handlers from the `RTCPeerConnection`.
   */
  detachEventHandlers() {
    const pc = this.pc;
    pc.removeEventListener('icecandidate', this.onIceCandidate);
    pc.removeEventListener('icecandidateerror', this.onIceCandidateError);
    pc.removeEventListener('signalingstatechange', this.onSignalingChange);
    pc.removeEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    pc.removeEventListener('icegatheringstatechange', this.onIceGatherChange);
    this.unsubscribeIceTrickle?.();
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Performs an ICE restart on the `RTCPeerConnection`.
   */
  protected abstract restartIce(): Promise<void>;

  /**
   * Attempts to restart ICE on the `RTCPeerConnection`.
   * This method intentionally doesn't await the `restartIce()` method,
   * allowing it to run in the background and handle any errors that may occur.
   */
  protected tryRestartIce = () => {
    this.restartIce().catch((e) => {
      this.logger.error('restartICE() failed, initiating reconnect', e);
      const strategy =
        e instanceof NegotiationError &&
        e.error.code === ErrorCode.PARTICIPANT_SIGNAL_LOST
          ? WebsocketReconnectStrategy.FAST
          : WebsocketReconnectStrategy.REJOIN;
      this.onReconnectionNeeded?.(
        strategy,
        ReconnectReason.RESTART_ICE_FAILED,
        this.peerType,
      );
    });
  };

  /**
   * Handles events synchronously.
   * Consecutive events are queued and executed one after the other.
   */
  protected on = <E extends keyof AllSfuEvents>(
    event: E,
    fn: CallEventListener<E>,
  ): void => {
    const getTag = () => this.tag;
    this.subscriptions.push(
      this.dispatcher.on(event, getTag, (e) => {
        const lockKey = `pc.${this.lock}.${event}`;
        withoutConcurrency(lockKey, async () => fn(e)).catch((err) => {
          if (this.isDisposed) return;
          this.logger.warn(`Error handling ${event}`, err);
        });
      }),
    );
  };

  /**
   * Appends the trickled ICE candidates to the `RTCPeerConnection`.
   */
  protected addTrickledIceCandidates = () => {
    const { iceTrickleBuffer } = this.sfuClient;
    const observable =
      this.peerType === PeerType.SUBSCRIBER
        ? iceTrickleBuffer.subscriberCandidates
        : iceTrickleBuffer.publisherCandidates;

    this.unsubscribeIceTrickle?.();
    this.unsubscribeIceTrickle = createSafeAsyncSubscription(
      observable,
      async (candidate) => {
        return this.pc.addIceCandidate(candidate).catch((e) => {
          if (this.isDisposed) return;
          this.logger.warn(`ICE candidate error`, e, candidate);
        });
      },
    );
  };

  /**
   * Sets the SFU client to use.
   *
   * @param sfuClient the SFU client to use.
   */
  setSfuClient = (sfuClient: StreamSfuClient) => {
    this.sfuClient = sfuClient;
    this.tag = sfuClient.tag;
  };

  /**
   * Returns the result of the `RTCPeerConnection.getStats()` method
   * @param selector an optional `MediaStreamTrack` to get the stats for.
   */
  getStats = (selector?: MediaStreamTrack | null) => {
    return this.pc.getStats(selector);
  };

  /**
   * Maps the given track ID to the corresponding track type.
   */
  getTrackType = (trackId: string): TrackType | undefined => {
    return this.trackIdToTrackType.get(trackId);
  };

  /**
   * Checks if the `RTCPeerConnection` is healthy.
   * It checks the ICE connection state and the peer connection state.
   * If either state is `failed`, `disconnected`, or `closed`,
   * it returns `false`, otherwise it returns `true`.
   */
  isHealthy = () => {
    const failedStates = new Set<
      RTCIceConnectionState | RTCPeerConnectionState
    >(['failed', 'closed']);

    const iceState = this.pc.iceConnectionState;
    const connectionState = this.pc.connectionState;
    return !failedStates.has(iceState) && !failedStates.has(connectionState);
  };

  /**
   * Returns true only when the peer connection is currently fully established
   * (ICE `connected`/`completed` AND connection state `connected`).
   * Transient states like `disconnected`, `checking`, or `new` return false.
   */
  isStable = () => {
    const iceState = this.pc.iceConnectionState;
    const connectionState = this.pc.connectionState;
    return (
      (iceState === 'connected' || iceState === 'completed') &&
      connectionState === 'connected'
    );
  };

  /**
   * Handles the ICECandidate event and
   * Initiates an ICE Trickle process with the SFU.
   */
  private onIceCandidate = (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      this.logger.debug('null ice candidate');
      return;
    }

    const iceCandidate = this.asJSON(candidate);
    this.sfuClient
      .iceTrickle({ peerType: this.peerType, iceCandidate })
      .catch((err) => {
        if (this.isDisposed) return;
        this.logger.warn(`ICETrickle failed`, err);
      });
  };

  /**
   * Converts the ICE candidate to a JSON string.
   */
  private asJSON = (candidate: RTCIceCandidate): string => {
    if (!candidate.usernameFragment) {
      // react-native-webrtc doesn't include usernameFragment in the candidate
      const segments = candidate.candidate.split(' ');
      const ufragIndex = segments.findIndex((s) => s === 'ufrag') + 1;
      const usernameFragment = segments[ufragIndex];
      return JSON.stringify({ ...candidate, usernameFragment });
    }
    return JSON.stringify(candidate.toJSON());
  };

  /**
   * Handles the ConnectionStateChange event.
   */
  private onConnectionStateChange = async () => {
    const state = this.pc.connectionState;
    this.logger.debug(`Connection state changed`, state);
    if (this.tracer && (state === 'connected' || state === 'failed')) {
      try {
        const stats = await this.stats.get();
        this.tracer.trace('getstats', stats.delta);
      } catch (err) {
        this.tracer.trace('getstatsOnFailure', (err as Error).toString());
      }
    }

    // we can't recover from a failed connection state (contrary to ICE)
    if (state === 'failed') {
      this.onReconnectionNeeded?.(
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.CONNECTION_FAILED,
        this.peerType,
      );
      return;
    }

    this.handleConnectionStateUpdate(state);
  };

  /**
   * Handles the ICE connection state change event.
   */
  private onIceConnectionStateChange = () => {
    const state = this.pc.iceConnectionState;
    this.logger.debug(`ICE connection state changed`, state);
    this.handleConnectionStateUpdate(state);
  };

  private handleConnectionStateUpdate = (
    state: RTCIceConnectionState | RTCPeerConnectionState,
  ) => {
    const { callingState } = this.state;
    if (callingState === CallingState.OFFLINE) return;
    if (callingState === CallingState.RECONNECTING) return;

    // do nothing when ICE is restarting
    if (this.isIceRestarting) return;

    // Pre-connect handling: ICE has never reached `connected`/`completed`.
    // Restart is futile here (the data plane was never established), but
    // these two terminal-ish states need different treatment:
    // - `failed` is terminal, escalate to REJOIN so a new SFU/credentials
    //   /PC configuration gets a chance, and let `Call.reconnect` count
    //   this toward the unsupported-network budget.
    // - `disconnected` is transient, the browser may yet move back to
    //   `checking`/`connected`. Don't restart, don't escalate; wait it
    //   out. If it ultimately fails, ICE will transition to `failed` and
    //   the branch above will take over.
    if (!this.iceHasEverConnected) {
      if (state === 'failed') {
        this.logger.info('ICE failed before connected, escalating to REJOIN');
        clearTimeout(this.preConnectStuckTimeout);
        this.preConnectStuckTimeout = undefined;
        this.onReconnectionNeeded?.(
          WebsocketReconnectStrategy.REJOIN,
          ReconnectReason.ICE_NEVER_CONNECTED,
          this.peerType,
        );
        return;
      }
      if (state === 'disconnected') {
        this.logger.info('ICE disconnected before connected, wait to recover');
        // Watchdog: if the browser stays in `disconnected` without ever
        // reaching `connected` or transitioning to `failed`, escalate to
        // REJOIN ourselves so we don't wait silently forever. Rare but
        // observed on flaky mobile networks.
        clearTimeout(this.preConnectStuckTimeout);
        this.preConnectStuckTimeout = setTimeout(() => {
          if (
            !this.iceHasEverConnected &&
            this.pc.iceConnectionState === 'disconnected'
          ) {
            this.logger.info(
              'ICE stuck in pre-connect disconnected, escalating to REJOIN',
            );
            this.onReconnectionNeeded?.(
              WebsocketReconnectStrategy.REJOIN,
              ReconnectReason.ICE_NEVER_CONNECTED,
              this.peerType,
            );
          }
        }, this.iceRestartDelay * 2);
        return;
      }
    }

    switch (state) {
      case 'failed':
        // in the `failed` state, we try to restart ICE immediately
        this.logger.info('restartICE due to failed connection');
        this.tryRestartIce();
        break;

      case 'disconnected':
        // in the `disconnected` state, we schedule a restartICE() after a delay
        // as the browser might recover the connection in the meantime
        this.logger.info('disconnected connection, scheduling restartICE');
        clearTimeout(this.iceRestartTimeout);
        this.iceRestartTimeout = setTimeout(() => {
          const currentState = this.pc.iceConnectionState;
          if (currentState === 'disconnected' || currentState === 'failed') {
            this.tryRestartIce();
          }
        }, this.iceRestartDelay);
        break;

      case 'connected':
      case 'completed':
        // Fire `onIceConnected` exactly once per peer-connection lifetime —
        // the first time ICE reaches `connected`/`completed` end-to-end.
        // Used by `Call` to reset the unsupported-network failure counter
        // only after WebRTC has actually recovered, not merely on SFU join.
        if (!this.iceHasEverConnected) {
          this.iceHasEverConnected = true;
          this.onIceConnected?.(this.peerType);
        }
        // clear any scheduled restartICE since the connection is healthy
        if (this.iceRestartTimeout) {
          this.logger.info('connected connection, canceling restartICE');
          clearTimeout(this.iceRestartTimeout);
          this.iceRestartTimeout = undefined;
        }
        // clear the pre-connect watchdog if it was armed
        clearTimeout(this.preConnectStuckTimeout);
        this.preConnectStuckTimeout = undefined;
        break;
    }
  };

  /**
   * Handles the ICE candidate error event.
   */
  private onIceCandidateError = (e: Event) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent
        ? `${e.errorCode}: ${e.errorText}`
        : e;
    this.logger.debug('ICE Candidate error', errorMessage);
  };

  /**
   * Handles the ICE gathering state change event.
   */
  private onIceGatherChange = () => {
    this.logger.debug(`ICE Gathering State`, this.pc.iceGatheringState);
  };

  /**
   * Handles the signaling state change event.
   */
  private onSignalingChange = () => {
    this.logger.debug(`Signaling state changed`, this.pc.signalingState);
  };
}
