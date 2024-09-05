import { StreamSfuClient } from '../StreamSfuClient';
import { getIceCandidate } from './helpers/iceCandidate';
import { PeerType } from '../gen/video/sfu/models/models';
import { SubscriberOffer } from '../gen/video/sfu/event/events';
import { Dispatcher } from './Dispatcher';
import { getLogger } from '../logger';
import { CallingState, CallState } from '../store';
import { withoutConcurrency } from '../helpers/concurrency';
import { toTrackType, trackTypeToParticipantStreamKey } from './helpers/tracks';
import { Logger } from '../coordinator/connection/types';

export type SubscriberOpts = {
  sfuClient: StreamSfuClient;
  dispatcher: Dispatcher;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  onUnrecoverableError?: () => void;
  logTag: string;
};

/**
 * A wrapper around the `RTCPeerConnection` that handles the incoming
 * media streams from the SFU.
 *
 * @internal
 */
export class Subscriber {
  private readonly logger: Logger;
  private pc: RTCPeerConnection;
  private sfuClient: StreamSfuClient;
  private state: CallState;

  private readonly unregisterOnSubscriberOffer: () => void;
  private readonly unregisterOnIceRestart: () => void;
  private readonly onUnrecoverableError?: () => void;

  private isIceRestarting = false;

  /**
   * Constructs a new `Subscriber` instance.
   *
   * @param sfuClient the SFU client to use.
   * @param dispatcher the dispatcher to use.
   * @param state the state of the call.
   * @param connectionConfig the connection configuration to use.
   * @param iceRestartDelay the delay in milliseconds to wait before restarting ICE when connection goes to `disconnected` state.
   * @param onUnrecoverableError a callback to call when an unrecoverable error occurs.
   * @param logTag a tag to use for logging.
   */
  constructor({
    sfuClient,
    dispatcher,
    state,
    connectionConfig,
    onUnrecoverableError,
    logTag,
  }: SubscriberOpts) {
    this.logger = getLogger(['Subscriber', logTag]);
    this.sfuClient = sfuClient;
    this.state = state;
    this.onUnrecoverableError = onUnrecoverableError;

    this.pc = this.createPeerConnection(connectionConfig);

    const subscriberOfferConcurrencyTag = Symbol('subscriberOffer');
    this.unregisterOnSubscriberOffer = dispatcher.on(
      'subscriberOffer',
      (subscriberOffer) => {
        withoutConcurrency(subscriberOfferConcurrencyTag, () => {
          return this.negotiate(subscriberOffer);
        }).catch((err) => {
          this.logger('error', `Negotiation failed.`, err);
        });
      },
    );

    const iceRestartConcurrencyTag = Symbol('iceRestart');
    this.unregisterOnIceRestart = dispatcher.on('iceRestart', (iceRestart) => {
      withoutConcurrency(iceRestartConcurrencyTag, async () => {
        if (iceRestart.peerType !== PeerType.SUBSCRIBER) return;
        await this.restartIce();
      }).catch((err) => {
        this.logger('error', `ICERestart failed`, err);
        this.onUnrecoverableError?.();
      });
    });
  }

  /**
   * Creates a new `RTCPeerConnection` instance with the given configuration.
   *
   * @param connectionConfig the connection configuration to use.
   */
  private createPeerConnection = (connectionConfig?: RTCConfiguration) => {
    const pc = new RTCPeerConnection(connectionConfig);
    pc.addEventListener('icecandidate', this.onIceCandidate);
    pc.addEventListener('track', this.handleOnTrack);

    pc.addEventListener('icecandidateerror', this.onIceCandidateError);
    pc.addEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    pc.addEventListener(
      'icegatheringstatechange',
      this.onIceGatheringStateChange,
    );

    return pc;
  };

  /**
   * Closes the `RTCPeerConnection` and unsubscribes from the dispatcher.
   */
  close = () => {
    this.detachEventHandlers();
    this.pc.close();
  };

  /**
   * Detaches the event handlers from the `RTCPeerConnection`.
   * This is useful when we want to replace the `RTCPeerConnection`
   * instance with a new one (in case of migration).
   */
  detachEventHandlers = () => {
    this.unregisterOnSubscriberOffer();
    this.unregisterOnIceRestart();

    this.pc.removeEventListener('icecandidate', this.onIceCandidate);
    this.pc.removeEventListener('track', this.handleOnTrack);
    this.pc.removeEventListener('icecandidateerror', this.onIceCandidateError);
    this.pc.removeEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    this.pc.removeEventListener(
      'icegatheringstatechange',
      this.onIceGatheringStateChange,
    );
  };

  /**
   * Returns the result of the `RTCPeerConnection.getStats()` method
   * @param selector
   * @returns
   */
  getStats = (selector?: MediaStreamTrack | null | undefined) => {
    return this.pc.getStats(selector);
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
   * Restarts the ICE connection and renegotiates with the SFU.
   */
  restartIce = async () => {
    this.logger('debug', 'Restarting ICE connection');
    if (this.pc.signalingState === 'have-remote-offer') {
      this.logger('debug', 'ICE restart is already in progress');
      return;
    }
    if (this.pc.connectionState === 'new') {
      this.logger(
        'debug',
        `ICE connection is not yet established, skipping restart.`,
      );
      return;
    }
    const previousIsIceRestarting = this.isIceRestarting;
    try {
      this.isIceRestarting = true;
      await this.sfuClient.iceRestart({
        peerType: PeerType.SUBSCRIBER,
      });
    } catch (e) {
      // restore the previous state, as our intent for restarting ICE failed
      this.isIceRestarting = previousIsIceRestarting;
      throw e;
    }
  };

  private handleOnTrack = (e: RTCTrackEvent) => {
    const [primaryStream] = e.streams;
    // example: `e3f6aaf8-b03d-4911-be36-83f47d37a76a:TRACK_TYPE_VIDEO`
    const [trackId, rawTrackType] = primaryStream.id.split(':');
    const participantToUpdate = this.state.participants.find(
      (p) => p.trackLookupPrefix === trackId,
    );
    this.logger(
      'debug',
      `[onTrack]: Got remote ${rawTrackType} track for userId: ${participantToUpdate?.userId}`,
      e.track.id,
      e.track,
    );

    const trackDebugInfo = `${participantToUpdate?.userId} ${rawTrackType}:${trackId}`;
    e.track.addEventListener('mute', () => {
      this.logger('info', `[onTrack]: Track muted: ${trackDebugInfo}`);
    });

    e.track.addEventListener('unmute', () => {
      this.logger('info', `[onTrack]: Track unmuted: ${trackDebugInfo}`);
    });

    e.track.addEventListener('ended', () => {
      this.logger('info', `[onTrack]: Track ended: ${trackDebugInfo}`);
      this.state.removeOrphanedTrack(primaryStream.id);
    });

    const trackType = toTrackType(rawTrackType);
    if (!trackType) {
      return this.logger('error', `Unknown track type: ${rawTrackType}`);
    }

    if (!participantToUpdate) {
      this.logger(
        'warn',
        `[onTrack]: Received track for unknown participant: ${trackId}`,
        e,
      );
      this.state.registerOrphanedTrack({
        id: primaryStream.id,
        trackLookupPrefix: trackId,
        track: primaryStream,
        trackType,
      });
      return;
    }

    const streamKindProp = trackTypeToParticipantStreamKey(trackType);
    if (!streamKindProp) {
      this.logger('error', `Unknown track type: ${rawTrackType}`);
      return;
    }
    const previousStream = participantToUpdate[streamKindProp];
    if (previousStream) {
      this.logger(
        'info',
        `[onTrack]: Cleaning up previous remote ${e.track.kind} tracks for userId: ${participantToUpdate.userId}`,
      );
      previousStream.getTracks().forEach((t) => {
        t.stop();
        previousStream.removeTrack(t);
      });
    }
    this.state.updateParticipant(participantToUpdate.sessionId, {
      [streamKindProp]: primaryStream,
    });
  };

  private onIceCandidate = (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      this.logger('debug', 'null ice candidate');
      return;
    }

    this.sfuClient
      .iceTrickle({
        iceCandidate: getIceCandidate(candidate),
        peerType: PeerType.SUBSCRIBER,
      })
      .catch((err) => {
        this.logger('warn', `ICETrickle failed`, err);
      });
  };

  private negotiate = async (subscriberOffer: SubscriberOffer) => {
    this.logger('info', `Received subscriberOffer`, subscriberOffer);

    await this.pc.setRemoteDescription({
      type: 'offer',
      sdp: subscriberOffer.sdp,
    });

    this.sfuClient.iceTrickleBuffer.subscriberCandidates.subscribe(
      async (candidate) => {
        try {
          const iceCandidate = JSON.parse(candidate.iceCandidate);
          await this.pc.addIceCandidate(iceCandidate);
        } catch (e) {
          this.logger('warn', `ICE candidate error`, [e, candidate]);
        }
      },
    );

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    await this.sfuClient.sendAnswer({
      peerType: PeerType.SUBSCRIBER,
      sdp: answer.sdp || '',
    });

    this.isIceRestarting = false;
  };

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

  private onIceGatheringStateChange = () => {
    this.logger(
      'debug',
      `ICE gathering state changed`,
      this.pc.iceGatheringState,
    );
  };

  private onIceCandidateError = (e: Event) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    const iceState = this.pc.iceConnectionState;
    const logLevel =
      iceState === 'connected' || iceState === 'checking' ? 'debug' : 'warn';
    this.logger(logLevel, `ICE Candidate error`, errorMessage);
  };
}
