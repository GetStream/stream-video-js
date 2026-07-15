import { BasePeerConnection } from './BasePeerConnection';
import { BasePeerConnectionOpts, ReconnectReason } from './types';
import { NegotiationError } from './NegotiationError';
import {
  PeerType,
  TrackType,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';
import { SubscriberOffer } from '../gen/video/sfu/event/events';
import { toTrackType, trackTypeToParticipantStreamKey } from './helpers/tracks';
import { pushToIfMissing, removeFromIfPresent } from '../helpers/array';
import { enableStereo, removeCodecsExcept } from './helpers/sdp';

/**
 * A wrapper around the `RTCPeerConnection` that handles the incoming
 * media streams from the SFU.
 *
 * @internal
 */
export class Subscriber extends BasePeerConnection {
  /**
   * Remote streams received from the SFU. For a self-sub case
   * we need to be able to distinguish between the local capture stream.
   * The map will never contain local streams so we can safely use it to
   * check if the stream is remote and dispose it when needed.
   */
  private trackedStreams?: WeakSet<MediaStream>;
  private negotiationFailures = 0;

  /**
   * Constructs a new `Subscriber` instance.
   */
  constructor(opts: BasePeerConnectionOpts) {
    super(PeerType.SUBSCRIBER, opts);
    this.pc.addEventListener('track', this.handleOnTrack);

    this.on('subscriberOffer', async (subscriberOffer) => {
      try {
        const result = await this.negotiate(subscriberOffer);
        this.negotiationFailures = 0;
        return result;
      } catch (err: any) {
        const message = 'subscriber.negotiationFailed';
        this.tracer?.trace(message, err.message);
        this.logger.warn(message, err);

        const failures = ++this.negotiationFailures;
        if (failures < 3) return this.tryRestartIce();

        this.logger.error(`negotiation failed ${failures} times, rejoining`);
        this.onReconnectionNeeded?.(
          WebsocketReconnectStrategy.REJOIN,
          ReconnectReason.SUBSCRIBER_NEGOTIATION_FAILED,
          this.peerType,
        );
      }
    });
  }

  /**
   * Detaches the event handlers from the `RTCPeerConnection`.
   * This is useful when we want to replace the `RTCPeerConnection`
   * instance with a new one (in case of migration).
   */
  detachEventHandlers() {
    super.detachEventHandlers();
    this.pc.removeEventListener('track', this.handleOnTrack);
  }

  /**
   * Restarts the ICE connection and renegotiates with the SFU.
   */
  restartIce = async () => {
    this.logger.debug('Restarting ICE connection');
    if (this.pc.signalingState === 'have-remote-offer') {
      this.logger.debug('ICE negotiation is already in progress');
      return;
    }
    if (this.pc.connectionState === 'new') {
      this.logger.debug(`ICE connection not yet established, skipping restart`);
      return;
    }
    const previousIsIceRestarting = this.isIceRestarting;
    this.isIceRestarting = true;
    try {
      const { response } = await this.sfuClient.iceRestart({
        peerType: PeerType.SUBSCRIBER,
      });
      if (response.error) throw new NegotiationError(response.error);
    } catch (e) {
      // restore the previous state, as our intent for restarting ICE failed
      this.isIceRestarting = previousIsIceRestarting;
      throw e;
    }
  };

  private handleOnTrack = (e: RTCTrackEvent) => {
    const { streams, track } = e;
    const [primaryStream] = streams;
    // example: `e3f6aaf8-b03d-4911-be36-83f47d37a76a:TRACK_TYPE_VIDEO`
    const [trackId, rawTrackType] = primaryStream.id.split(':');
    const participantToUpdate = this.state.participants.find(
      (p) => p.trackLookupPrefix === trackId,
    );
    const isSelfSub = !!participantToUpdate?.isLocalParticipant;
    this.logger.debug(
      `[onTrack]: Got remote ${rawTrackType} track for userId: ${participantToUpdate?.userId}`,
      track.id,
      track,
    );

    const trackType = toTrackType(rawTrackType);
    if (!trackType) {
      return this.logger.error(`Unknown track type: ${rawTrackType}`);
    }

    const trackDebugInfo = `${participantToUpdate?.userId} ${rawTrackType}:${trackId}`;
    track.addEventListener('mute', () => {
      this.logger.info(`[onTrack]: Track muted: ${trackDebugInfo}`);
      this.setRemoteTrackInterrupted(trackId, trackType, true);
    });
    track.addEventListener('unmute', () => {
      this.logger.info(`[onTrack]: Track unmuted: ${trackDebugInfo}`);
      this.setRemoteTrackInterrupted(trackId, trackType, false);
      this.onRemoteTrackUnmute?.(trackType, track.id);
    });
    track.addEventListener('ended', () => {
      this.logger.info(`[onTrack]: Track ended: ${trackDebugInfo}`);
      this.setRemoteTrackInterrupted(trackId, trackType, false);
      this.state.removeOrphanedTrack(primaryStream.id);
    });

    if (track.muted) {
      this.setRemoteTrackInterrupted(trackId, trackType, true);
    }

    this.trackIdToTrackType.set(track.id, trackType);

    if (isSelfSub) {
      this.trackedStreams ??= new WeakSet<MediaStream>();
      this.trackedStreams.add(primaryStream);
    }

    if (!participantToUpdate) {
      this.logger.warn(
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
      this.logger.error(`Unknown track type: ${rawTrackType}`);
      return;
    }

    // Self-sub loopback audio routes to the speaker by default, which
    // would echo the local user's voice. Default-mute here; consumers
    // (the loopback recording hook) re-enable explicitly when needed.
    if (isSelfSub && e.track.kind === 'audio') {
      e.track.enabled = false;
    }

    // get the previous stream to dispose it later
    // usually this happens during migration, when the stream is replaced
    // with a new one but the old one is still in the state
    const previousStream = participantToUpdate[streamKindProp];

    // replace the previous stream with the new one, prevents flickering
    this.state.updateParticipant(participantToUpdate.sessionId, {
      [streamKindProp]: primaryStream,
    });

    if (previousStream) {
      if (isSelfSub && !this.trackedStreams?.has(previousStream)) {
        // this is the local capture stream, we don't want to dispose it
        this.logger.debug(
          `[onTrack]: Skipping cleanup of previous ${e.track.kind} stream for userId: ${participantToUpdate.userId} because it is not tracked`,
        );
        return;
      }

      this.logger.info(
        `[onTrack]: Cleaning up previous remote ${track.kind} tracks for userId: ${participantToUpdate.userId}`,
      );
      previousStream.getTracks().forEach((t) => {
        t.stop();
        previousStream.removeTrack(t);
      });
    }
  };

  private setRemoteTrackInterrupted = (
    trackId: string,
    trackType: TrackType,
    interrupted: boolean,
  ) => {
    if (trackType !== TrackType.AUDIO) return;
    const target = this.state.participants.find(
      (p) => p.trackLookupPrefix === trackId,
    );
    if (!target) return;
    this.state.updateParticipant(target.sessionId, (p) => {
      const current = p.interruptedTracks ?? [];
      const has = current.includes(trackType);
      if (interrupted === has) return {};
      const next = interrupted
        ? pushToIfMissing([...current], trackType)
        : removeFromIfPresent([...current], trackType);
      return { interruptedTracks: next };
    });
  };

  private negotiate = async (subscriberOffer: SubscriberOffer) => {
    // The generation currently committed on the peer connection. If this
    // negotiation fails and rolls back, the buffer is restored to it.
    const previousSdp = this.pc.currentRemoteDescription?.sdp;
    try {
      await this.pc.setRemoteDescription({
        type: 'offer',
        sdp: subscriberOffer.sdp,
      });

      this.addTrickledIceCandidates();

      const answer = await this.pc.createAnswer();
      if (answer.sdp) {
        answer.sdp = enableStereo(subscriberOffer.sdp, answer.sdp);
        const { dangerouslyForceCodec, subscriberFmtpLine } =
          this.clientPublishOptions || {};
        if (dangerouslyForceCodec) {
          answer.sdp = removeCodecsExcept(
            answer.sdp,
            dangerouslyForceCodec,
            subscriberFmtpLine,
          );
        }
      }
      await this.pc.setLocalDescription(answer);

      await this.sfuClient.sendAnswer({
        peerType: PeerType.SUBSCRIBER,
        sdp: answer.sdp || '',
        negotiationId: subscriberOffer.negotiationId,
      });
    } catch (err) {
      if (this.pc.signalingState === 'have-remote-offer') {
        await this.pc.setRemoteDescription({ type: 'rollback' }).catch((e) => {
          this.logger.warn('Failed to rollback after negotiation error', e);
        });
        const { iceTrickleBuffer } = this.sfuClient;
        iceTrickleBuffer.updateActiveGeneration(this.peerType, previousSdp);
      }
      throw err;
    } finally {
      this.isIceRestarting = false;
    }
  };
}
