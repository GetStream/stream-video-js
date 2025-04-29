import { getLogger } from '../logger';
import type {
  CallEventListener,
  Logger,
} from '../coordinator/connection/types';
import { CallingState, CallState } from '../store';
import { createSafeAsyncSubscription } from '../store/rxUtils';
import { ClientDetails, PeerType } from '../gen/video/sfu/models/models';
import { StreamSfuClient } from '../StreamSfuClient';
import { AllSfuEvents, Dispatcher } from './Dispatcher';
import { withoutConcurrency } from '../helpers/concurrency';
import { Tracer, traceRTCPeerConnection, TraceSlice } from '../stats';

export type BasePeerConnectionOpts = {
  sfuClient: StreamSfuClient;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  dispatcher: Dispatcher;
  onUnrecoverableError?: (reason: string) => void;
  logTag: string;
  clientDetails: ClientDetails;
  enableTracing: boolean;
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
  protected isIceRestarting = false;
  private isDisposed = false;

  private readonly tracer?: Tracer;
  private readonly subscriptions: (() => void)[] = [];
  private unsubscribeIceTrickle?: () => void;

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
      clientDetails,
      enableTracing,
    }: BasePeerConnectionOpts,
  ) {
    this.peerType = peerType;
    this.sfuClient = sfuClient;
    this.state = state;
    this.dispatcher = dispatcher;
    this.onUnrecoverableError = onUnrecoverableError;
    this.logger = getLogger([
      peerType === PeerType.SUBSCRIBER ? 'Subscriber' : 'Publisher',
      logTag,
    ]);
    this.pc = new RTCPeerConnection(connectionConfig);
    if (enableTracing) {
      const tag = `${logTag}-${peerType === PeerType.SUBSCRIBER ? 'sub' : 'pub'}`;
      this.tracer = new Tracer(tag);
      this.tracer.trace('clientDetails', clientDetails);
      this.tracer.trace('create', connectionConfig);
      traceRTCPeerConnection(this.pc, this.tracer.trace);
    }
    this.pc.addEventListener('icecandidate', this.onIceCandidate);
    this.pc.addEventListener('icecandidateerror', this.onIceCandidateError);
    this.pc.addEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    this.pc.addEventListener('icegatheringstatechange', this.onIceGatherChange);
    this.pc.addEventListener('signalingstatechange', this.onSignalingChange);
  }

  /**
   * Disposes the `RTCPeerConnection` instance.
   */
  dispose() {
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
        withoutConcurrency(`pc.${event}`, async () => fn(e)).catch((err) => {
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
   * Returns the current tracing buffer.
   */
  getTrace = (): TraceSlice | undefined => {
    return this.tracer?.take();
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
   * Handles the ICE connection state change event.
   */
  private onIceConnectionStateChange = () => {
    const state = this.pc.iceConnectionState;
    this.logger('debug', `ICE connection state changed`, state);

    if (this.state.callingState === CallingState.OFFLINE) return;
    if (this.state.callingState === CallingState.RECONNECTING) return;

    // do nothing when ICE is restarting
    if (this.isIceRestarting) return;

    if (state === 'failed' || state === 'disconnected') {
      this.logger('debug', `Attempting to restart ICE`);
      this.restartIce().catch((e) => {
        if (this.isDisposed) return;
        const reason = `ICE restart failed`;
        this.logger('error', reason, e);
        this.onUnrecoverableError?.(`${reason}: ${e}`);
      });
    }
  };

  /**
   * Handles the ICE candidate error event.
   */
  private onIceCandidateError = (e: Event) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    const iceState = this.pc.iceConnectionState;
    const logLevel =
      iceState === 'connected' || iceState === 'checking' ? 'debug' : 'warn';
    this.logger(logLevel, `ICE Candidate error`, errorMessage);
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
