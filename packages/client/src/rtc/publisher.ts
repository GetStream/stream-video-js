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
  private readonly publisher: RTCPeerConnection;
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
  private readonly trackKindRegistry: {
    [key in TrackType]: 'video' | 'audio' | undefined;
  } = {
    [TrackType.AUDIO]: 'audio',
    [TrackType.VIDEO]: 'video',
    [TrackType.SCREEN_SHARE]: 'video',
    [TrackType.SCREEN_SHARE_AUDIO]: undefined,
    [TrackType.UNSPECIFIED]: undefined,
  };
  private readonly isDtxEnabled: boolean;
  private readonly isRedEnabled: boolean;
  private readonly preferredVideoCodec?: string;

  /**
   * An array of tracks that have been most-recently announced to the SFU.
   */
  announcedTracks: TrackInfo[] = [];

  /**
   * The SFU client instance to use for publishing and signaling.
   */
  sfuClient: StreamSfuClient;

  constructor({
    connectionConfig,
    sfuClient,
    state,
    isDtxEnabled,
    isRedEnabled,
    preferredVideoCodec,
  }: PublisherOpts) {
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

    this.publisher = pc;
    this.sfuClient = sfuClient;
    this.state = state;
    this.isDtxEnabled = isDtxEnabled;
    this.isRedEnabled = isRedEnabled;
    this.preferredVideoCodec = preferredVideoCodec;
  }

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
    let transceiver = this.publisher
      .getTransceivers()
      .find(
        (t) =>
          t === this.transceiverRegistry[trackType] &&
          t.sender.track &&
          t.sender.track?.kind === this.trackKindRegistry[trackType],
      );

    /**
     * An event handler which listens for the 'ended' event on the track.
     * Once the track has ended, it will notify the SFU and update the state.
     */
    const handleTrackEnded = async () => {
      console.log(`Track ${TrackType[trackType]} has ended, notifying the SFU`);
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

      transceiver = this.publisher.addTransceiver(track, {
        direction: 'sendonly',
        streams:
          trackType === TrackType.VIDEO || trackType === TrackType.SCREEN_SHARE
            ? [mediaStream]
            : undefined,
        sendEncodings: videoEncodings,
      });

      this.transceiverRegistry[trackType] = transceiver;

      if ('setCodecPreferences' in transceiver && codecPreferences) {
        console.log(
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
    const transceiver = this.publisher
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
   *
   * @param options - Options
   * @param options.stopTracks - If `true` (default), all tracks will be stopped.
   */
  stopPublishing = (
    options: {
      stopTracks?: boolean;
    } = {},
  ) => {
    const { stopTracks = true } = options;
    if (stopTracks) {
      this.publisher.getSenders().forEach((s) => {
        s.track?.stop();

        if (this.publisher.signalingState !== 'closed') {
          this.publisher.removeTrack(s);
        }
      });
    }
    this.publisher.close();
  };

  updateVideoPublishQuality = async (enabledRids: string[]) => {
    console.log('Update publish quality, requested rids by SFU:', enabledRids);

    const videoSender = this.transceiverRegistry[TrackType.VIDEO]?.sender;
    if (!videoSender) return;

    const params = videoSender.getParameters();
    let changed = false;
    params.encodings.forEach((enc) => {
      // flip 'active' flag only when necessary
      const shouldEnable = enabledRids.includes(enc.rid!);
      if (shouldEnable !== enc.active) {
        enc.active = shouldEnable;
        changed = true;
      }
    });
    if (changed) {
      if (params.encodings.length === 0) {
        console.warn('No suitable video encoding quality found');
      }
      await videoSender.setParameters(params);
      console.log(
        `Update publish quality, enabled rids: ${params.encodings
          .filter((e) => e.active)
          .map((e) => e.rid)
          .join(', ')}`,
      );
    }
  };

  /**
   * Returns the result of the `RTCPeerConnection.getStats()` method
   * @param selector
   * @returns
   */
  getStats(selector?: MediaStreamTrack | null | undefined) {
    return this.publisher.getStats(selector);
  }

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
      console.log('null ice candidate');
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
    this.publisher.setConfiguration(connectionConfig);
    this.sfuClient = sfuClient;

    if (this.announcedTracks.length > 0) {
      // negotiate only if there are tracks to publish
      await this.negotiate({ iceRestart: true });
    }
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
    const offer = await this.publisher.createOffer(options);
    offer.sdp = this.mungeCodecs(offer.sdp);
    await this.publisher.setLocalDescription(offer);

    const trackInfos = this.getCurrentTrackInfos();
    const { response } = await this.sfuClient.setPublisher({
      sdp: offer.sdp || '',
      tracks: trackInfos,
    });

    // store the most-recently announced tracks
    this.announcedTracks = trackInfos;

    try {
      await this.publisher.setRemoteDescription({
        type: 'answer',
        sdp: response.sdp,
      });
    } catch (e) {
      console.error(`Publisher: setRemoteDescription error`, response.sdp, e);
    }

    this.sfuClient.iceTrickleBuffer.publisherCandidates.subscribe(
      async (candidate) => {
        try {
          const iceCandidate = JSON.parse(candidate.iceCandidate);
          await this.publisher.addIceCandidate(iceCandidate);
        } catch (e) {
          console.error(`Publisher: ICE candidate error`, e, candidate);
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

  private getCurrentTrackInfos = () => {
    const metadata = this.state.metadata;
    const targetResolution = metadata?.settings.video.target_resolution;
    return this.publisher
      .getTransceivers()
      .filter((t) => t.direction === 'sendonly' && !!t.sender.track)
      .map<TrackInfo>((transceiver) => {
        const trackType = Number(
          Object.keys(this.transceiverRegistry).find(
            (key) =>
              this.transceiverRegistry[key as any as TrackType] === transceiver,
          ),
        );
        const track = transceiver.sender.track!;
        const optimalLayers =
          trackType === TrackType.VIDEO
            ? findOptimalVideoLayers(track, targetResolution)
            : trackType === TrackType.SCREEN_SHARE
            ? findOptimalScreenSharingLayers(track)
            : [];

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
          mid: transceiver.mid || '',

          // FIXME OL: adjust these values
          stereo: false,
          dtx: this.isDtxEnabled,
          red: this.isRedEnabled,
        };
      });
  };

  private onIceCandidateError = (e: Event) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    console.error(`Publisher: ICE Candidate error`, errorMessage);
  };

  private onIceConnectionStateChange = () => {
    console.log(
      `Publisher: ICE Connection state changed`,
      this.publisher.iceConnectionState,
    );
  };

  private onIceGatheringStateChange = () => {
    console.log(
      `Publisher: ICE Gathering State`,
      this.publisher.iceGatheringState,
    );
  };

  private ridToVideoQuality = (rid: string): VideoQuality => {
    return rid === 'q'
      ? VideoQuality.LOW_UNSPECIFIED
      : rid === 'h'
      ? VideoQuality.MID
      : VideoQuality.HIGH; // default to HIGH
  };
}
