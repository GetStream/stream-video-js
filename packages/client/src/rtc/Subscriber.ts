import { BasePeerConnection } from './BasePeerConnection';
import { BasePeerConnectionOpts } from './types';
import { NegotiationError } from './NegotiationError';
import { PeerType } from '../gen/video/sfu/models/models';
import { SubscriberOffer } from '../gen/video/sfu/event/events';
import { toTrackType, trackTypeToParticipantStreamKey } from './helpers/tracks';
import { enableStereo } from './helpers/sdp';

/**
 * A wrapper around the `RTCPeerConnection` that handles the incoming
 * media streams from the SFU.
 *
 * @internal
 */
export class Subscriber extends BasePeerConnection {
  /**
   * Constructs a new `Subscriber` instance.
   */
  constructor(opts: BasePeerConnectionOpts) {
    super(PeerType.SUBSCRIBER, opts);
    this.pc.addEventListener('track', this.handleOnTrack);

    this.on('subscriberOffer', async (subscriberOffer) => {
      return this.negotiate(subscriberOffer).catch((err) => {
        this.logger.error(`Negotiation failed.`, err);
      });
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
      this.logger.debug('ICE restart is already in progress');
      return;
    }
    if (this.pc.connectionState === 'new') {
      this.logger.debug(
        `ICE connection is not yet established, skipping restart.`,
      );
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
    const [primaryStream] = e.streams;
    // example: `e3f6aaf8-b03d-4911-be36-83f47d37a76a:TRACK_TYPE_VIDEO`
    const [trackId, rawTrackType] = primaryStream.id.split(':');
    const participantToUpdate = this.state.participants.find(
      (p) => p.trackLookupPrefix === trackId,
    );
    this.logger.debug(
      `[onTrack]: Got remote ${rawTrackType} track for userId: ${participantToUpdate?.userId}`,
      e.track.id,
      e.track,
    );

    const trackDebugInfo = `${participantToUpdate?.userId} ${rawTrackType}:${trackId}`;
    e.track.addEventListener('mute', () => {
      this.logger.info(`[onTrack]: Track muted: ${trackDebugInfo}`);
    });

    e.track.addEventListener('unmute', () => {
      this.logger.info(`[onTrack]: Track unmuted: ${trackDebugInfo}`);
    });

    e.track.addEventListener('ended', () => {
      this.logger.info(`[onTrack]: Track ended: ${trackDebugInfo}`);
      this.state.removeOrphanedTrack(primaryStream.id);
    });

    const trackType = toTrackType(rawTrackType);
    if (!trackType) {
      return this.logger.error(`Unknown track type: ${rawTrackType}`);
    }

    this.trackIdToTrackType.set(e.track.id, trackType);

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

    // get the previous stream to dispose it later
    // usually this happens during migration, when the stream is replaced
    // with a new one but the old one is still in the state
    const previousStream = participantToUpdate[streamKindProp];

    // replace the previous stream with the new one, prevents flickering
    this.state.updateParticipant(participantToUpdate.sessionId, {
      [streamKindProp]: primaryStream,
    });

    // now, dispose the previous stream if it exists
    if (previousStream) {
      this.logger.info(
        `[onTrack]: Cleaning up previous remote ${e.track.kind} tracks for userId: ${participantToUpdate.userId}`,
      );
      previousStream.getTracks().forEach((t) => {
        t.stop();
        previousStream.removeTrack(t);
      });
    }
  };

  private negotiate = async (subscriberOffer: SubscriberOffer) => {
    await this.pc.setRemoteDescription({
      type: 'offer',
      sdp: subscriberOffer.sdp,
    });

    this.addTrickledIceCandidates();

    const answer = await this.pc.createAnswer();
    if (answer.sdp) {
      answer.sdp = enableStereo(subscriberOffer.sdp, answer.sdp);
    }
    await this.pc.setLocalDescription(answer);

    await this.sfuClient.sendAnswer({
      peerType: PeerType.SUBSCRIBER,
      sdp: answer.sdp || '',
    });

    this.isIceRestarting = false;
  };
}
