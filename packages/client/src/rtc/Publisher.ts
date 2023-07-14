import * as SDP from 'sdp-transform';
import { StreamSfuClient } from '../StreamSfuClient';
import {
  PeerType,
  TrackInfo,
  TrackType,
  VideoLayer,
  VideoQuality,
} from '../gen/video/sfu/models/models';
import { getIceCandidate } from './helpers/iceCandidate';
import {
  findOptimalScreenSharingLayers,
  findOptimalVideoLayers,
  OptimalVideoLayer,
} from './videoLayers';
import { getPreferredCodecs } from './codecs';
import {
  trackTypeToDeviceIdKey,
  trackTypeToParticipantStreamKey,
} from './helpers/tracks';
import { CallState } from '../store';
import { PublishOptions } from '../types';
import { isReactNative } from '../helpers/platforms';
import {
  removeCodec,
  setPreferredCodec,
  toggleDtx,
} from '../helpers/sdp-munging';
import { Logger } from '../coordinator/connection/types';
import { getLogger } from '../logger';

export type PublisherOpts = {
  sfuClient: StreamSfuClient;
  state: CallState;
  connectionConfig?: RTCConfiguration;
  isDtxEnabled: boolean;
  isRedEnabled: boolean;
  preferredVideoCodec?: string;
};

/**
 * The `Publisher` is responsible for publishing/unpublishing media streams to/from the SFU
 * @internal
 */
export class Publisher {
  private pc: RTCPeerConnection;
  private readonly state: CallState;

  private readonly transceiverRegistry: {
    [key in TrackType]: RTCRtpTransceiver | undefined;
  } = {
    [TrackType.AUDIO]: undefined,
    [TrackType.VIDEO]: undefined,
    [TrackType.SCREEN_SHARE]: undefined,
    [TrackType.SCREEN_SHARE_AUDIO]: undefined,
    [TrackType.UNSPECIFIED]: undefined,
  };
  /**
   * An array maintaining the order how transceivers were added to the peer connection.
   * This is needed because some browsers (Firefox) don't reliably report
   * trackId and `mid` parameters.
   *
   * @private
   */
  private transceiverInitOrder: TrackType[] = [];

  private readonly trackKindMapping: {
    [key in TrackType]: 'video' | 'audio' | undefined;
  } = {
    [TrackType.AUDIO]: 'audio',
    [TrackType.VIDEO]: 'video',
    [TrackType.SCREEN_SHARE]: 'video',
    [TrackType.SCREEN_SHARE_AUDIO]: undefined,
    [TrackType.UNSPECIFIED]: undefined,
  };

  private readonly trackLayersCache: {
    [key in TrackType]: OptimalVideoLayer[] | undefined;
  } = {
    [TrackType.AUDIO]: undefined,
    [TrackType.VIDEO]: undefined,
    [TrackType.SCREEN_SHARE]: undefined,
    [TrackType.SCREEN_SHARE_AUDIO]: undefined,
    [TrackType.UNSPECIFIED]: undefined,
  };

  private readonly isDtxEnabled: boolean;
  private readonly isRedEnabled: boolean;
  private readonly preferredVideoCodec?: string;
  private logger: Logger = getLogger(['Publisher']);

  /**
   * The SFU client instance to use for publishing and signaling.
   */
  sfuClient: StreamSfuClient;

  /**
   * Constructs a new `Publisher` instance.
   *
   * @param connectionConfig the connection configuration to use.
   * @param sfuClient the SFU client to use.
   * @param state the call state to use.
   * @param isDtxEnabled whether DTX is enabled.
   * @param isRedEnabled whether RED is enabled.
   * @param preferredVideoCodec the preferred video codec.
   */
  constructor({
    connectionConfig,
    sfuClient,
    state,
    isDtxEnabled,
    isRedEnabled,
    preferredVideoCodec,
  }: PublisherOpts) {
    this.pc = this.createPeerConnection(connectionConfig);
    this.sfuClient = sfuClient;
    this.state = state;
    this.isDtxEnabled = isDtxEnabled;
    this.isRedEnabled = isRedEnabled;
    this.preferredVideoCodec = preferredVideoCodec;
  }

  private createPeerConnection = (connectionConfig?: RTCConfiguration) => {
    const pc = new RTCPeerConnection(connectionConfig);
    pc.addEventListener('icecandidate', this.onIceCandidate);
    pc.addEventListener('negotiationneeded', this.onNegotiationNeeded);

    pc.addEventListener('icecandidateerror', this.onIceCandidateError);
    pc.addEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    pc.addEventListener(
      'icegatheringstatechange',
      this.onIceGatheringStateChange,
    );
    pc.addEventListener('signalingstatechange', this.onSignalingStateChange);
    return pc;
  };

  /**
   * Closes the publisher PeerConnection and cleans up the resources.
   */
  close = ({ stopTracks = true } = {}) => {
    if (stopTracks) {
      this.stopPublishing();
      Object.keys(this.transceiverRegistry).forEach((trackType) => {
        // @ts-ignore
        this.transceiverRegistry[trackType] = undefined;
      });
      Object.keys(this.trackLayersCache).forEach((trackType) => {
        // @ts-ignore
        this.trackLayersCache[trackType] = undefined;
      });
    }

    this.pc.removeEventListener('negotiationneeded', this.onNegotiationNeeded);
    this.pc.close();
  };

  /**
   * Starts publishing the given track of the given media stream.
   *
   * Consecutive calls to this method will replace the stream.
   * The previous stream will be stopped.
   * @param mediaStream
   * @param track
   * @param trackType
   * @param opts
   */
  publishStream = async (
    mediaStream: MediaStream,
    track: MediaStreamTrack,
    trackType: TrackType,
    opts: PublishOptions = {},
  ) => {
    if (track.readyState === 'ended') {
      throw new Error(`Can't publish a track that has ended already.`);
    }

    let transceiver = this.pc
      .getTransceivers()
      .find(
        (t) =>
          t === this.transceiverRegistry[trackType] &&
          t.sender.track &&
          t.sender.track?.kind === this.trackKindMapping[trackType],
      );

    /**
     * An event handler which listens for the 'ended' event on the track.
     * Once the track has ended, it will notify the SFU and update the state.
     */
    const handleTrackEnded = async () => {
      this.logger(
        'info',
        `Track ${TrackType[trackType]} has ended, notifying the SFU`,
      );
      await this.notifyTrackMuteStateChanged(
        mediaStream,
        track,
        trackType,
        true,
      );
      // clean-up, this event listener needs to run only once.
      track.removeEventListener('ended', handleTrackEnded);
    };

    if (!transceiver) {
      const metadata = this.state.metadata;
      const targetResolution = metadata?.settings.video.target_resolution;
      const videoEncodings =
        trackType === TrackType.VIDEO
          ? findOptimalVideoLayers(track, targetResolution)
          : undefined;

      const codecPreferences = this.getCodecPreferences(
        trackType,
        opts.preferredCodec,
      );

      // listen for 'ended' event on the track as it might be ended abruptly
      // by an external factor as permission revokes, device disconnected, etc.
      // keep in mind that `track.stop()` doesn't trigger this event.
      track.addEventListener('ended', handleTrackEnded);

      transceiver = this.pc.addTransceiver(track, {
        direction: 'sendonly',
        streams:
          trackType === TrackType.VIDEO || trackType === TrackType.SCREEN_SHARE
            ? [mediaStream]
            : undefined,
        sendEncodings: videoEncodings,
      });

      this.logger('debug', `Added ${TrackType[trackType]} transceiver`);
      this.transceiverInitOrder.push(trackType);
      this.transceiverRegistry[trackType] = transceiver;

      if ('setCodecPreferences' in transceiver && codecPreferences) {
        this.logger(
          'info',
          `Setting ${TrackType[trackType]} codec preferences`,
          codecPreferences,
        );
        transceiver.setCodecPreferences(codecPreferences);
      }
    } else {
      const previousTrack = transceiver.sender.track;
      // don't stop the track if we are re-publishing the same track
      if (previousTrack && previousTrack !== track) {
        previousTrack.stop();
        previousTrack.removeEventListener('ended', handleTrackEnded);
        track.addEventListener('ended', handleTrackEnded);
      }
      await transceiver.sender.replaceTrack(track);
    }

    await this.notifyTrackMuteStateChanged(
      mediaStream,
      track,
      trackType,
      false,
    );
  };

  /**
   * Stops publishing the given track type to the SFU, if it is currently being published.
   * Underlying track will be stopped and removed from the publisher.
   * @param trackType the track type to unpublish.
   */
  unpublishStream = async (trackType: TrackType) => {
    const transceiver = this.pc
      .getTransceivers()
      .find((t) => t === this.transceiverRegistry[trackType] && t.sender.track);
    if (
      transceiver &&
      transceiver.sender.track &&
      transceiver.sender.track.readyState === 'live'
    ) {
      transceiver.sender.track.stop();
      return this.notifyTrackMuteStateChanged(
        undefined,
        transceiver.sender.track,
        trackType,
        true,
      );
    }
  };

  /**
   * Returns true if the given track type is currently being published to the SFU.
   *
   * @param trackType the track type to check.
   */
  isPublishing = (trackType: TrackType): boolean => {
    const transceiverForTrackType = this.transceiverRegistry[trackType];
    if (transceiverForTrackType && transceiverForTrackType.sender) {
      const sender = transceiverForTrackType.sender;
      return !!sender.track && sender.track.readyState === 'live';
    }
    return false;
  };

  private notifyTrackMuteStateChanged = async (
    mediaStream: MediaStream | undefined,
    track: MediaStreamTrack,
    trackType: TrackType,
    isMuted: boolean,
  ) => {
    await this.sfuClient.updateMuteState(trackType, isMuted);

    const audioOrVideoOrScreenShareStream =
      trackTypeToParticipantStreamKey(trackType);
    if (isMuted) {
      this.state.updateParticipant(this.sfuClient.sessionId, (p) => ({
        publishedTracks: p.publishedTracks.filter((t) => t !== trackType),
        [audioOrVideoOrScreenShareStream]: undefined,
      }));
    } else {
      const deviceId = track.getSettings().deviceId;
      const audioOrVideoDeviceKey = trackTypeToDeviceIdKey(trackType);
      this.state.updateParticipant(this.sfuClient.sessionId, (p) => {
        return {
          publishedTracks: p.publishedTracks.includes(trackType)
            ? p.publishedTracks
            : [...p.publishedTracks, trackType],
          ...(audioOrVideoDeviceKey && { [audioOrVideoDeviceKey]: deviceId }),
          [audioOrVideoOrScreenShareStream]: mediaStream,
        };
      });
    }
  };

  /**
   * Stops publishing all tracks and stop all tracks.
   */
  stopPublishing = () => {
    this.logger('debug', 'Stopping publishing all tracks');
    this.pc.getSenders().forEach((s) => {
      s.track?.stop();
      if (this.pc.signalingState !== 'closed') {
        this.pc.removeTrack(s);
      }
    });
  };

  updateVideoPublishQuality = async (enabledRids: string[]) => {
    this.logger(
      'info',
      'Update publish quality, requested rids by SFU:',
      enabledRids,
    );

    const videoSender = this.transceiverRegistry[TrackType.VIDEO]?.sender;
    if (!videoSender) {
      this.logger('warn', 'Update publish quality, no video sender found.');
      return;
    }

    const params = videoSender.getParameters();
    if (params.encodings.length === 0) {
      this.logger(
        'warn',
        'Update publish quality, No suitable video encoding quality found',
      );
      return;
    }

    let changed = false;
    params.encodings.forEach((enc) => {
      // flip 'active' flag only when necessary
      const shouldEnable = enabledRids.includes(enc.rid!);
      if (shouldEnable !== enc.active) {
        enc.active = shouldEnable;
        changed = true;
      }
    });

    const activeRids = params.encodings
      .filter((e) => e.active)
      .map((e) => e.rid)
      .join(', ');
    if (changed) {
      await videoSender.setParameters(params);
      this.logger(
        'info',
        `Update publish quality, enabled rids: ${activeRids}`,
      );
    } else {
      this.logger('info', `Update publish quality, no change: ${activeRids}`);
    }
  };

  /**
   * Returns the result of the `RTCPeerConnection.getStats()` method
   * @param selector
   * @returns
   */
  getStats = (selector?: MediaStreamTrack | null | undefined) => {
    return this.pc.getStats(selector);
  };

  private getCodecPreferences = (
    trackType: TrackType,
    preferredCodec?: string | null,
  ) => {
    if (trackType === TrackType.VIDEO) {
      return getPreferredCodecs('video', preferredCodec || 'vp8');
    }
    if (trackType === TrackType.AUDIO) {
      const defaultAudioCodec = this.isRedEnabled ? 'red' : 'opus';
      const codecToRemove = !this.isRedEnabled ? 'red' : undefined;
      return getPreferredCodecs(
        'audio',
        preferredCodec ?? defaultAudioCodec,
        codecToRemove,
      );
    }
  };

  private onIceCandidate = async (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      this.logger('debug', 'null ice candidate');
      return;
    }
    await this.sfuClient.iceTrickle({
      iceCandidate: getIceCandidate(candidate),
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
    });
  };

  /**
   * Performs a migration of this publisher instance to a new SFU.
   *
   * Initiates a new `iceRestart` offer/answer exchange with the new SFU.
   *
   * @param sfuClient the new SFU client to migrate to.
   * @param connectionConfig the new connection configuration to use.
   */
  migrateTo = async (
    sfuClient: StreamSfuClient,
    connectionConfig?: RTCConfiguration,
  ) => {
    this.sfuClient = sfuClient;
    this.pc.setConfiguration(connectionConfig);

    const shouldRestartIce = this.pc.iceConnectionState === 'connected';
    if (shouldRestartIce) {
      // negotiate only if there are tracks to publish
      await this.negotiate({ iceRestart: true });
    }
  };

  /**
   * Restarts the ICE connection and renegotiates with the SFU.
   */
  restartIce = async () => {
    this.logger('debug', 'Restarting ICE connection');
    await this.negotiate({ iceRestart: true });
  };

  private onNegotiationNeeded = async () => {
    await this.negotiate();
  };

  /**
   * Initiates a new offer/answer exchange with the currently connected SFU.
   *
   * @param options the optional offer options to use.
   */
  private negotiate = async (options?: RTCOfferOptions) => {
    const offer = await this.pc.createOffer(options);
    offer.sdp = this.mungeCodecs(offer.sdp);

    const trackInfos = this.getCurrentTrackInfos(offer.sdp);
    if (trackInfos.length === 0) {
      throw new Error(
        `Can't initiate negotiation without announcing any tracks`,
      );
    }

    await this.pc.setLocalDescription(offer);

    const { response } = await this.sfuClient.setPublisher({
      sdp: offer.sdp || '',
      tracks: trackInfos,
    });

    try {
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: response.sdp,
      });
    } catch (e) {
      this.logger('error', `setRemoteDescription error`, {
        sdp: response.sdp,
        error: e,
      });
    }

    this.sfuClient.iceTrickleBuffer.publisherCandidates.subscribe(
      async (candidate) => {
        try {
          const iceCandidate = JSON.parse(candidate.iceCandidate);
          await this.pc.addIceCandidate(iceCandidate);
        } catch (e) {
          this.logger('error', `ICE candidate error`, {
            error: e,
            candidate,
          });
        }
      },
    );
  };

  private mungeCodecs = (sdp?: string) => {
    if (sdp) {
      sdp = toggleDtx(sdp, this.isDtxEnabled);
      if (isReactNative()) {
        if (this.preferredVideoCodec) {
          sdp = setPreferredCodec(sdp, 'video', this.preferredVideoCodec);
        }
        sdp = setPreferredCodec(
          sdp,
          'audio',
          this.isRedEnabled ? 'red' : 'opus',
        );
        if (!this.isRedEnabled) {
          sdp = removeCodec(sdp, 'audio', 'red');
        }
      }
    }
    return sdp;
  };

  getCurrentTrackInfos = (sdp?: string) => {
    sdp = sdp || this.pc.localDescription?.sdp;
    const extractMid = (
      defaultMid: string | null,
      track: MediaStreamTrack,
      trackType: TrackType,
    ): string => {
      if (defaultMid) return defaultMid;
      if (!sdp) {
        this.logger('warn', 'No SDP found. Returning empty mid');
        return '';
      }

      this.logger(
        'debug',
        `No 'mid' found for track. Trying to find it from the Offer SDP`,
      );

      const parsedSdp = SDP.parse(sdp);
      const media = parsedSdp.media.find((m) => {
        return (
          m.type === track.kind &&
          // if `msid` is not present, we assume that the track is the first one
          (m.msid?.includes(track.id) ?? true)
        );
      });
      if (typeof media?.mid === 'undefined') {
        this.logger(
          'debug',
          `No mid found in SDP for track type ${track.kind} and id ${track.id}. Attempting to find a heuristic mid`,
        );

        const heuristicMid = this.transceiverInitOrder.indexOf(trackType);
        if (heuristicMid !== -1) {
          return String(heuristicMid);
        }

        this.logger('debug', 'No heuristic mid found. Returning empty mid');
        return '';
      }
      return String(media.mid);
    };

    const metadata = this.state.metadata;
    const targetResolution = metadata?.settings.video.target_resolution;
    return this.pc
      .getTransceivers()
      .filter((t) => t.direction === 'sendonly' && t.sender.track)
      .map<TrackInfo>((transceiver) => {
        const trackType: TrackType = Number(
          Object.keys(this.transceiverRegistry).find(
            (key) =>
              this.transceiverRegistry[key as any as TrackType] === transceiver,
          ),
        );
        const track = transceiver.sender.track!;
        let optimalLayers: OptimalVideoLayer[];
        if (track.readyState === 'live') {
          optimalLayers =
            trackType === TrackType.VIDEO
              ? findOptimalVideoLayers(track, targetResolution)
              : trackType === TrackType.SCREEN_SHARE
              ? findOptimalScreenSharingLayers(track)
              : [];
          this.trackLayersCache[trackType] = optimalLayers;
        } else {
          // we report the last known optimal layers for ended tracks
          optimalLayers = this.trackLayersCache[trackType] || [];
          this.logger(
            'debug',
            `Track ${TrackType[trackType]} is ended. Announcing last known optimal layers`,
            optimalLayers,
          );
        }

        const layers = optimalLayers.map<VideoLayer>((optimalLayer) => ({
          rid: optimalLayer.rid || '',
          bitrate: optimalLayer.maxBitrate || 0,
          fps: optimalLayer.maxFramerate || 0,
          quality: this.ridToVideoQuality(optimalLayer.rid || ''),
          videoDimension: {
            width: optimalLayer.width,
            height: optimalLayer.height,
          },
        }));

        return {
          trackId: track.id,
          layers: layers,
          trackType,
          mid: extractMid(transceiver.mid, track, trackType),

          // FIXME OL: adjust these values
          stereo: false,
          dtx: TrackType.AUDIO === trackType && this.isDtxEnabled,
          red: TrackType.AUDIO === trackType && this.isRedEnabled,
        };
      });
  };

  private onIceCandidateError = (e: Event) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    this.logger('error', `ICE Candidate error`, errorMessage);
  };

  private onIceConnectionStateChange = () => {
    const state = this.pc.iceConnectionState;
    this.logger('debug', `ICE Connection state changed to`, state);

    if (state === 'failed') {
      this.logger('warn', `Attempting to restart ICE`);
      this.restartIce().catch((e) => {
        this.logger('error', `ICE restart error`, e);
      });
    } else if (state === 'disconnected') {
      // when in `disconnected` state, the browser may recover automatically,
      // hence, we delay the ICE restart
      this.logger('warn', `Scheduling ICE restart in 5 seconds`);
      setTimeout(() => {
        // check if the state is still `disconnected` or `failed`
        // as the connection may have recovered (or failed) in the meantime
        if (
          this.pc.iceConnectionState === 'disconnected' ||
          this.pc.iceConnectionState === 'failed'
        ) {
          this.restartIce().catch((e) => {
            this.logger('error', `ICE restart error`, e);
          });
        }
      }, 5000);
    }
  };

  private onIceGatheringStateChange = () => {
    this.logger('debug', `ICE Gathering State`, this.pc.iceGatheringState);
  };

  private onSignalingStateChange = () => {
    this.logger('debug', `Signaling state changed`, this.pc.signalingState);
  };

  private ridToVideoQuality = (rid: string): VideoQuality => {
    return rid === 'q'
      ? VideoQuality.LOW_UNSPECIFIED
      : rid === 'h'
      ? VideoQuality.MID
      : VideoQuality.HIGH; // default to HIGH
  };
}
