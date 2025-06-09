import { getLogger } from '../logger';
import type {
  CallEventListener,
  Logger,
} from '../coordinator/connection/types';
import { CallingState, CallState } from '../store';
import { createSafeAsyncSubscription } from '../store/rxUtils';
import { PeerType, TrackType } from '../gen/video/sfu/models/models';
import { StreamSfuClient } from '../StreamSfuClient';
import { AllSfuEvents, Dispatcher } from './Dispatcher';
import { withoutConcurrency } from '../helpers/concurrency';
import { StatsTracer, Tracer, traceRTCPeerConnection } from '../stats';

export type BasePeerConnectionOpts = {
  sfuClient: StreamSfuClient;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  dispatcher: Dispatcher;
  onUnrecoverableError?: (reason: string) => void;
  logTag: string;
  enableTracing: boolean;
  iceRestartDelay?: number;
};

/**
 * A base class for the `Publisher` and `Subscriber` classes.
 * @internal
 */
export abstract class BasePeerConnection {
  protected readonly logger: Logger;
  protected readonly peerType: PeerType;
  protected readonly pc: RTCPeerConnection;
  protected readonly state: CallState;
  protected readonly dispatcher: Dispatcher;
  protected sfuClient: StreamSfuClient;

  protected onUnrecoverableError?: (reason: string) => void;
  private readonly iceRestartDelay: number;
  private iceRestartTimeout?: NodeJS.Timeout;
  protected isIceRestarting = false;
  private isDisposed = false;

  protected trackIdToTrackType = new Map<string, TrackType>();

  readonly tracer?: Tracer;
  readonly stats: StatsTracer;
  private readonly subscriptions: (() => void)[] = [];
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
      onUnrecoverableError,
      logTag,
      enableTracing,
      iceRestartDelay = 2500,
    }: BasePeerConnectionOpts,
  ) {
    this.peerType = peerType;
    this.sfuClient = sfuClient;
    this.state = state;
    this.dispatcher = dispatcher;
    this.iceRestartDelay = iceRestartDelay;
    this.onUnrecoverableError = onUnrecoverableError;
    this.logger = getLogger([
      peerType === PeerType.SUBSCRIBER ? 'Subscriber' : 'Publisher',
      logTag,
    ]);
    this.pc = new RTCPeerConnection(connectionConfig);
    this.pc.addEventListener('icecandidate', this.onIceCandidate);
    this.pc.addEventListener('icecandidateerror', this.onIceCandidateError);
    this.pc.addEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    this.pc.addEventListener('icegatheringstatechange', this.onIceGatherChange);
    this.pc.addEventListener('signalingstatechange', this.onSignalingChange);
    this.pc.addEventListener(
      'connectionstatechange',
      this.onConnectionStateChange,
    );
    this.stats = new StatsTracer(this.pc, peerType, this.trackIdToTrackType);
    if (enableTracing) {
      const tag = `${logTag}-${peerType === PeerType.SUBSCRIBER ? 'sub' : 'pub'}`;
      this.tracer = new Tracer(tag);
      this.tracer.trace('create', {
        url: sfuClient.edgeName,
        ...connectionConfig,
      });
      traceRTCPeerConnection(this.pc, this.tracer.trace);
    }
  }

  /**
   * Disposes the `RTCPeerConnection` instance.
   */
  dispose() {
    clearTimeout(this.iceRestartTimeout);
    this.iceRestartTimeout = undefined;
    this.onUnrecoverableError = undefined;
    this.isDisposed = true;
    this.detachEventHandlers();
    this.pc.close();
    this.tracer?.dispose();
  }

  /**
   * Detaches the event handlers from the `RTCPeerConnection`.
   */
  detachEventHandlers() {
    this.pc.removeEventListener('icecandidate', this.onIceCandidate);
    this.pc.removeEventListener('icecandidateerror', this.onIceCandidateError);
    this.pc.removeEventListener('signalingstatechange', this.onSignalingChange);
    this.pc.removeEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    this.pc.removeEventListener(
      'icegatheringstatechange',
      this.onIceGatherChange,
    );
    this.unsubscribeIceTrickle?.();
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
  }

  /**
   * Performs an ICE restart on the `RTCPeerConnection`.
   */
  protected abstract restartIce(): Promise<void>;

  /**
   * Handles events synchronously.
   * Consecutive events are queued and executed one after the other.
   */
  protected on = <E extends keyof AllSfuEvents>(
    event: E,
    fn: CallEventListener<E>,
  ): void => {
    this.subscriptions.push(
      this.dispatcher.on(event, (e) => {
        const lockKey = `pc.${this.lock}.${event}`;
        withoutConcurrency(lockKey, async () => fn(e)).catch((err) => {
          if (this.isDisposed) return;
          this.logger('warn', `Error handling ${event}`, err);
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
          this.logger('warn', `ICE candidate error`, e, candidate);
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
   * Handles the ICECandidate event and
   * Initiates an ICE Trickle process with the SFU.
   */
  private onIceCandidate = (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      this.logger('debug', 'null ice candidate');
      return;
    }

    const iceCandidate = this.asJSON(candidate);
    this.sfuClient
      .iceTrickle({ peerType: this.peerType, iceCandidate })
      .catch((err) => {
        if (this.isDisposed) return;
        this.logger('warn', `ICETrickle failed`, err);
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
    this.logger('debug', `Connection state changed`, state);
    if (!this.tracer) return;
    if (state === 'connected' || state === 'failed') {
      try {
        const stats = await this.stats.get();
        this.tracer.trace('getstats', stats.delta);
      } catch (err) {
        this.tracer.trace('getstatsOnFailure', (err as Error).toString());
      }
    }
  };

  /**
   * Handles the ICE connection state change event.
   */
  private onIceConnectionStateChange = () => {
    const state = this.pc.iceConnectionState;
    this.logger('debug', `ICE connection state changed`, state);

    const { callingState } = this.state;
    if (callingState === CallingState.OFFLINE) return;
    if (callingState === CallingState.RECONNECTING) return;

    // do nothing when ICE is restarting
    if (this.isIceRestarting) return;

    const tryRestartIce = () => {
      this.restartIce().catch((e) => {
        const reason = 'restartICE() failed, initiating reconnect';
        this.logger('error', reason, e);
        this.onUnrecoverableError?.(reason);
      });
    };

    if (state === 'failed') {
      // in the `failed` state, we try to restart ICE immediately
      this.logger('warn', 'restartICE() due to failed ICE connection');
      tryRestartIce();
    } else if (state === 'disconnected') {
      // in the ` disconnected ` state, we schedule a restartICE() after a delay
      // as the browser might recover the connection in the meantime
      this.logger('warn', 'disconnected connection, scheduling restartICE()');
      this.iceRestartTimeout = setTimeout(() => {
        const currentState = this.pc.iceConnectionState;
        if (currentState === 'disconnected' || currentState === 'failed') {
          return tryRestartIce();
        }
        this.logger('info', 'connection recovered, canceled restartICE()');
      }, this.iceRestartDelay);
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
    this.logger('debug', 'ICE Candidate error', errorMessage);
  };

  /**
   * Handles the ICE gathering state change event.
   */
  private onIceGatherChange = () => {
    this.logger('debug', `ICE Gathering State`, this.pc.iceGatheringState);
  };

  /**
   * Handles the signaling state change event.
   */
  private onSignalingChange = () => {
    this.logger('debug', `Signaling state changed`, this.pc.signalingState);
  };
}
