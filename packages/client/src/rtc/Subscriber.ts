import { StreamSfuClient } from '../StreamSfuClient';
import { getIceCandidate } from './helpers/iceCandidate';
import { PeerType } from '../gen/video/sfu/models/models';
import { SubscriberOffer } from '../gen/video/sfu/event/events';
import { Dispatcher } from './Dispatcher';
import { getLogger } from '../logger';
import { CallingState, CallState } from '../store';
import { createSubscription } from '../store/rxUtils';
import { withoutConcurrency } from '../helpers/concurrency';
import { toTrackType, trackTypeToParticipantStreamKey } from './helpers/tracks';

export type SubscriberOpts = {
  sfuClient: StreamSfuClient;
  dispatcher: Dispatcher;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  iceRestartDelay?: number;
  onUnrecoverableError?: () => void;
};

const logger = getLogger(['Subscriber']);

/**
 * A wrapper around the `RTCPeerConnection` that handles the incoming
 * media streams from the SFU.
 *
 * @internal
 */
export class Subscriber {
  private pc: RTCPeerConnection;
  private sfuClient: StreamSfuClient;
  private state: CallState;

  private readonly unregisterOnSubscriberOffer: () => void;
  private readonly unregisterOnIceRestart: () => void;
  private unregisterIceTrickleBuffer?: () => void;
  private readonly onUnrecoverableError?: () => void;

  private readonly iceRestartDelay: number;
  private isIceRestarting = false;
  private iceRestartTimeout?: NodeJS.Timeout;

  // workaround for the lack of RTCPeerConnection.getConfiguration() method in react-native-webrtc
  private _connectionConfiguration: RTCConfiguration | undefined;

  /**
   * Returns the current connection configuration.
   *
   * @internal
   */
  get connectionConfiguration() {
    if (this.pc.getConfiguration) return this.pc.getConfiguration();
    return this._connectionConfiguration;
  }

  /**
   * Constructs a new `Subscriber` instance.
   *
   * @param sfuClient the SFU client to use.
   * @param dispatcher the dispatcher to use.
   * @param state the state of the call.
   * @param connectionConfig the connection configuration to use.
   * @param iceRestartDelay the delay in milliseconds to wait before restarting ICE when connection goes to `disconnected` state.
   * @param onUnrecoverableError a callback to call when an unrecoverable error occurs.
   */
  constructor({
    sfuClient,
    dispatcher,
    state,
    connectionConfig,
    iceRestartDelay = 2500,
    onUnrecoverableError,
  }: SubscriberOpts) {
    this.sfuClient = sfuClient;
    this.state = state;
    this.iceRestartDelay = iceRestartDelay;
    this.onUnrecoverableError = onUnrecoverableError;

    this.pc = this.createPeerConnection(connectionConfig);

    const subscriberOfferConcurrencyTag = Symbol('subscriberOffer');
    this.unregisterOnSubscriberOffer = dispatcher.on(
      'subscriberOffer',
      (subscriberOffer) => {
        // TODO: use queue per peer connection, otherwise
        //  it could happen we consume an offer for a different peer connection
        withoutConcurrency(subscriberOfferConcurrencyTag, () => {
          return this.negotiate(subscriberOffer);
        }).catch((err) => {
          logger('warn', `Negotiation failed.`, err);
        });
      },
    );

    const iceRestartConcurrencyTag = Symbol('iceRestart');
    this.unregisterOnIceRestart = dispatcher.on('iceRestart', (iceRestart) => {
      withoutConcurrency(iceRestartConcurrencyTag, async () => {
        if (iceRestart.peerType !== PeerType.SUBSCRIBER) return;
        await this.restartIce();
      }).catch((err) => {
        logger('warn', `ICERestart failed`, err);
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
    this._connectionConfiguration = connectionConfig;
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
    clearTimeout(this.iceRestartTimeout);
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
    this.unregisterIceTrickleBuffer?.();

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
    logger('debug', 'Restarting ICE connection');
    if (this.pc.signalingState === 'have-remote-offer') {
      logger('debug', 'ICE restart is already in progress');
      return;
    }
    if (this.pc.connectionState === 'new') {
      logger(
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
    logger(
      'debug',
      `[onTrack]: Got remote ${rawTrackType} track for userId: ${participantToUpdate?.userId}`,
      e.track.id,
      e.track,
    );

    const trackDebugInfo = `${participantToUpdate?.userId} ${rawTrackType}:${trackId}`;
    e.track.addEventListener('mute', () => {
      logger('info', `[onTrack]: Track muted: ${trackDebugInfo}`);
    });

    e.track.addEventListener('unmute', () => {
      logger('info', `[onTrack]: Track unmuted: ${trackDebugInfo}`);
    });

    e.track.addEventListener('ended', () => {
      logger('info', `[onTrack]: Track ended: ${trackDebugInfo}`);
      this.state.removeOrphanedTrack(primaryStream.id);
    });

    const trackType = toTrackType(rawTrackType);
    if (!trackType) {
      return logger('error', `Unknown track type: ${rawTrackType}`);
    }

    if (!participantToUpdate) {
      logger(
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
      logger('error', `Unknown track type: ${rawTrackType}`);
      return;
    }
    const previousStream = participantToUpdate[streamKindProp];
    if (previousStream) {
      logger(
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
      logger('debug', 'null ice candidate');
      return;
    }

    this.sfuClient
      .iceTrickle({
        iceCandidate: getIceCandidate(candidate),
        peerType: PeerType.SUBSCRIBER,
      })
      .catch((err) => {
        logger('warn', `ICETrickle failed`, err);
      });
  };

  private negotiate = async (subscriberOffer: SubscriberOffer) => {
    logger('info', `Received subscriberOffer`, subscriberOffer);

    await this.pc.setRemoteDescription({
      type: 'offer',
      sdp: subscriberOffer.sdp,
    });

    // unsubscribe from the previous negotiation, if available
    this.unregisterIceTrickleBuffer?.();
    this.unregisterIceTrickleBuffer = createSubscription(
      this.sfuClient.iceTrickleBuffer.subscriberCandidates,
      async (t) => {
        try {
          const candidate: RTCIceCandidateInit = JSON.parse(t.iceCandidate);
          await this.pc.addIceCandidate(candidate);
        } catch (e) {
          logger('warn', `Can't add ICE candidate`, e, t);
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
    if (this.state.callingState === CallingState.RECONNECTING) return;

    const state = this.pc.iceConnectionState;
    logger('debug', `ICE connection state changed`, state);

    // do nothing when ICE is restarting
    if (this.isIceRestarting) return;

    const hasNetworkConnection =
      this.state.callingState !== CallingState.OFFLINE;

    if (state === 'failed') {
      logger('debug', `Attempting to restart ICE`);
      this.restartIce().catch((e) => {
        logger('error', `ICE restart failed`, e);
        this.onUnrecoverableError?.();
      });
    } else if (state === 'disconnected' && hasNetworkConnection) {
      // when in `disconnected` state, the browser may recover automatically,
      // hence, we delay the ICE restart
      logger('debug', `Scheduling ICE restart in ${this.iceRestartDelay} ms.`);
      this.iceRestartTimeout = setTimeout(() => {
        // check if the state is still `disconnected` or `failed`
        // as the connection may have recovered (or failed) in the meantime
        if (
          this.pc.iceConnectionState === 'disconnected' ||
          this.pc.iceConnectionState === 'failed'
        ) {
          this.restartIce().catch((e) => {
            logger('error', `ICE restart failed`, e);
            this.onUnrecoverableError?.();
          });
        } else {
          logger(
            'debug',
            `Scheduled ICE restart: connection recovered, canceled.`,
          );
        }
      }, this.iceRestartDelay);
    }
  };

  private onIceGatheringStateChange = () => {
    logger('debug', `ICE gathering state changed`, this.pc.iceGatheringState);
  };

  private onIceCandidateError = (e: Event) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    const iceState = this.pc.iceConnectionState;
    const logLevel =
      iceState === 'connected' || iceState === 'checking' ? 'debug' : 'warn';
    logger(logLevel, `ICE Candidate error`, errorMessage);
  };
}
