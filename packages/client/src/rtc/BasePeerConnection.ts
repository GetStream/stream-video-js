import { getLogger } from '../logger';
import type { Logger } from '../coordinator/connection/types';
import { CallingState, CallState } from '../store';
import { PeerType } from '../gen/video/sfu/models/models';
import { StreamSfuClient } from '../StreamSfuClient';

export type BasePeerConnectionOpts = {
  sfuClient: StreamSfuClient;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  onUnrecoverableError?: () => void;
  logTag: string;
};

/**
 * A base class for the `Publisher` and `Subscriber` classes.
 * @internal
 */
export abstract class BasePeerConnection {
  protected readonly logger: Logger;
  protected readonly state: CallState;
  protected readonly pc: RTCPeerConnection;
  protected readonly peerType: PeerType;
  protected sfuClient: StreamSfuClient;

  protected readonly onUnrecoverableError?: () => void;
  protected isIceRestarting = false;

  /**
   * Constructs a new `BasePeerConnection` instance.
   */
  protected constructor(
    peerType: PeerType,
    {
      sfuClient,
      connectionConfig,
      state,
      onUnrecoverableError,
      logTag,
    }: BasePeerConnectionOpts,
  ) {
    this.peerType = peerType;
    this.sfuClient = sfuClient;
    this.state = state;
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
  }

  /**
   * Disposes the `RTCPeerConnection` instance.
   */
  protected dispose = () => {
    this.detachEventHandlers();
    this.pc.close();
  };

  /**
   * Detaches the event handlers from the `RTCPeerConnection`.
   */
  protected detachEventHandlers() {
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
  }

  /**
   * Performs an ICE restart on the `RTCPeerConnection`.
   */
  protected abstract restartIce(): Promise<void>;

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
   * Handles the ICECandidate event and
   * Initiates an ICE Trickle process with the SFU.
   */
  private onIceCandidate = (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      this.logger('debug', 'null ice candidate');
      return;
    }

    const iceCandidate = this.toJSON(candidate);
    this.sfuClient
      .iceTrickle({ peerType: this.peerType, iceCandidate })
      .catch((err) => this.logger('warn', `ICETrickle failed`, err));
  };

  /**
   * Converts the ICE candidate to a JSON string.
   */
  private toJSON = (candidate: RTCIceCandidate): string => {
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

    if (this.state.callingState === CallingState.RECONNECTING) return;

    // do nothing when ICE is restarting
    if (this.isIceRestarting) return;

    if (state === 'failed' || state === 'disconnected') {
      this.logger('debug', `Attempting to restart ICE`);
      this.restartIce().catch((e) => {
        this.logger('error', `ICE restart failed`, e);
        this.onUnrecoverableError?.();
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