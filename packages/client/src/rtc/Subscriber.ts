import { StreamSfuClient } from '../StreamSfuClient';
import { getIceCandidate } from './helpers/iceCandidate';
import { PeerType } from '../gen/video/sfu/models/models';
import { SubscriberOffer } from '../gen/video/sfu/event/events';
import { Dispatcher } from './Dispatcher';
import { getLogger } from '../logger';
import { CallingState, CallState } from '../store';

export type SubscriberOpts = {
  sfuClient: StreamSfuClient;
  dispatcher: Dispatcher;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  iceRestartDelay?: number;
};

const logger = getLogger(['Subscriber']);

/**
 * A wrapper around the `RTCPeerConnection` that handles the incoming
 * media streams from the SFU.
 */
export class Subscriber {
  private pc: RTCPeerConnection;
  private sfuClient: StreamSfuClient;
  private state: CallState;

  private readonly unregisterOnSubscriberOffer: () => void;
  private readonly unregisterOnIceRestart: () => void;

  private readonly iceRestartDelay: number;
  private isIceRestarting = false;
  private iceRestartTimeout?: NodeJS.Timeout;

  /**
   * Constructs a new `Subscriber` instance.
   *
   * @param sfuClient the SFU client to use.
   * @param dispatcher the dispatcher to use.
   * @param state the state of the call.
   * @param connectionConfig the connection configuration to use.
   * @param iceRestartDelay the delay in milliseconds to wait before restarting ICE when connection goes to `disconnected` state.
   */
  constructor({
    sfuClient,
    dispatcher,
    state,
    connectionConfig,
    iceRestartDelay = 2500,
  }: SubscriberOpts) {
    this.sfuClient = sfuClient;
    this.state = state;
    this.iceRestartDelay = iceRestartDelay;

    this.pc = this.createPeerConnection(connectionConfig);

    this.unregisterOnSubscriberOffer = dispatcher.on(
      'subscriberOffer',
      async (message) => {
        if (message.eventPayload.oneofKind !== 'subscriberOffer') return;
        const { subscriberOffer } = message.eventPayload;
        await this.negotiate(subscriberOffer);
      },
    );

    this.unregisterOnIceRestart = dispatcher.on(
      'iceRestart',
      async (message) => {
        if (message.eventPayload.oneofKind !== 'iceRestart') return;
        const { iceRestart } = message.eventPayload;
        if (iceRestart.peerType !== PeerType.SUBSCRIBER) return;
        await this.restartIce();
      },
    );
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
    clearTimeout(this.iceRestartTimeout);
    this.unregisterOnSubscriberOffer();
    this.unregisterOnIceRestart();
    this.pc.close();
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
   * Migrates the subscriber to a new SFU client.
   *
   * @param sfuClient the new SFU client to migrate to.
   * @param connectionConfig the new connection configuration to use.
   */
  migrateTo = (
    sfuClient: StreamSfuClient,
    connectionConfig?: RTCConfiguration,
  ) => {
    this.setSfuClient(sfuClient);

    // when migrating, we want to keep the previous subscriber open
    // until the new one is connected
    const previousPC = this.pc;

    // we keep a record of previously available video tracks
    // so that we can monitor when they become available on the new
    // subscriber and close the previous one.
    const trackIdsToMigrate = new Set<string>();
    previousPC.getReceivers().forEach((r) => {
      if (r.track.kind === 'video') {
        trackIdsToMigrate.add(r.track.id);
      }
    });

    // set up a new subscriber peer connection, configured to connect
    // to the new SFU node
    const pc = this.createPeerConnection(connectionConfig);

    let migrationTimeoutId: NodeJS.Timeout;
    const cleanupMigration = () => {
      previousPC.close();
      clearTimeout(migrationTimeoutId);
    };

    // When migrating, we want to keep track of the video tracks
    // that are migrating to the new subscriber.
    // Once all of them are available, we can close the previous subscriber.
    const handleTrackMigration = (e: RTCTrackEvent) => {
      logger(
        'debug',
        `[Migration]: Migrated track: ${e.track.id}, ${e.track.kind}`,
      );
      trackIdsToMigrate.delete(e.track.id);
      if (trackIdsToMigrate.size === 0) {
        logger('debug', `[Migration]: Migration complete`);
        pc.removeEventListener('track', handleTrackMigration);
        cleanupMigration();
      }
    };

    // When migrating, we want to keep track of the connection state
    // of the new subscriber.
    // Once it is connected, we give it a 2-second grace period to receive
    // all the video tracks that are migrating from the previous subscriber.
    // After this threshold, we abruptly close the previous subscriber.
    const handleConnectionStateChange = () => {
      if (pc.connectionState === 'connected') {
        migrationTimeoutId = setTimeout(() => {
          pc.removeEventListener('track', handleTrackMigration);
          cleanupMigration();
        }, 2000);

        pc.removeEventListener(
          'connectionstatechange',
          handleConnectionStateChange,
        );
      }
    };

    pc.addEventListener('track', handleTrackMigration);
    pc.addEventListener('connectionstatechange', handleConnectionStateChange);

    // replace the PeerConnection instance
    this.pc = pc;
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
    const [trackId, trackType] = primaryStream.id.split(':');
    const participantToUpdate = this.state.participants.find(
      (p) => p.trackLookupPrefix === trackId,
    );
    logger(
      'debug',
      `[onTrack]: Got remote ${trackType} track for userId: ${participantToUpdate?.userId}`,
      e.track.id,
      e.track,
    );
    if (!participantToUpdate) {
      logger(
        'error',
        `[onTrack]: Received track for unknown participant: ${trackId}`,
        e,
      );
      return;
    }

    e.track.addEventListener('mute', () => {
      logger(
        'info',
        `[onTrack]: Track muted: ${participantToUpdate.userId} ${trackType}:${trackId}`,
      );
    });

    e.track.addEventListener('unmute', () => {
      logger(
        'info',
        `[onTrack]: Track unmuted: ${participantToUpdate.userId} ${trackType}:${trackId}`,
      );
    });

    e.track.addEventListener('ended', () => {
      logger(
        'info',
        `[onTrack]: Track ended: ${participantToUpdate.userId} ${trackType}:${trackId}`,
      );
    });

    const streamKindProp = (
      {
        TRACK_TYPE_AUDIO: 'audioStream',
        TRACK_TYPE_VIDEO: 'videoStream',
        TRACK_TYPE_SCREEN_SHARE: 'screenShareStream',
        TRACK_TYPE_SCREEN_SHARE_AUDIO: 'screenShareAudioStream',
      } as const
    )[trackType];

    if (!streamKindProp) {
      logger('error', `Unknown track type: ${trackType}`);
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

  private onIceCandidate = async (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      logger('debug', 'null ice candidate');
      return;
    }

    await this.sfuClient.iceTrickle({
      iceCandidate: getIceCandidate(candidate),
      peerType: PeerType.SUBSCRIBER,
    });
  };

  private negotiate = async (subscriberOffer: SubscriberOffer) => {
    logger('info', `Received subscriberOffer`, subscriberOffer);

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
          logger('warn', `ICE candidate error`, [e, candidate]);
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
    logger('debug', `ICE connection state changed`, state);

    // do nothing when ICE is restarting
    if (this.isIceRestarting) return;

    const hasNetworkConnection =
      this.state.callingState !== CallingState.OFFLINE;

    if (state === 'failed') {
      logger('warn', `Attempting to restart ICE`);
      this.restartIce().catch((e) => {
        logger('error', `ICE restart failed`, e);
      });
    } else if (state === 'disconnected' && hasNetworkConnection) {
      // when in `disconnected` state, the browser may recover automatically,
      // hence, we delay the ICE restart
      logger('warn', `Scheduling ICE restart in ${this.iceRestartDelay} ms.`);
      this.iceRestartTimeout = setTimeout(() => {
        // check if the state is still `disconnected` or `failed`
        // as the connection may have recovered (or failed) in the meantime
        if (
          this.pc.iceConnectionState === 'disconnected' ||
          this.pc.iceConnectionState === 'failed'
        ) {
          this.restartIce().catch((e) => {
            logger('error', `ICE restart failed`, e);
          });
        } else {
          logger(
            'debug',
            `Scheduled ICE restart: connection recovered, canceled.`,
          );
        }
      }, 5000);
    }
  };

  private onIceGatheringStateChange = () => {
    logger('debug', `ICE gathering state changed`, this.pc.iceGatheringState);
  };

  private onIceCandidateError = (e: Event) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    const logLevel =
      this.pc.iceConnectionState === 'connected' ? 'debug' : 'error';
    logger(logLevel, `ICE Candidate error`, errorMessage);
  };
}
