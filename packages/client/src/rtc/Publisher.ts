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
import { trackTypeToParticipantStreamKey } from './helpers/tracks';
import { CallingState, CallState } from '../store';
import { PublishOptions } from '../types';
import { isReactNative } from '../helpers/platforms';
import { enableHighQualityAudio, toggleDtx } from '../helpers/sdp-munging';
import { Logger } from '../coordinator/connection/types';
import { getLogger } from '../logger';
import { Dispatcher } from './Dispatcher';
import { getOSInfo } from '../client-details';
import { VideoLayerSetting } from '../gen/video/sfu/event/events';
import { TargetResolutionResponse } from '../gen/shims';

export type PublisherConstructorOpts = {
  sfuClient: StreamSfuClient;
  state: CallState;
  dispatcher: Dispatcher;
  connectionConfig?: RTCConfiguration;
  isDtxEnabled: boolean;
  isRedEnabled: boolean;
  onUnrecoverableError?: () => void;
  logTag: string;
};

/**
 * The `Publisher` is responsible for publishing/unpublishing media streams to/from the SFU
 *
 * @internal
 */
export class Publisher {
  private readonly logger: Logger;
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

  private readonly publishOptionsPerTrackType = new Map<
    TrackType,
    PublishOptions
  >();

  /**
   * An array maintaining the order how transceivers were added to the peer connection.
   * This is needed because some browsers (Firefox) don't reliably report
   * trackId and `mid` parameters.
   *
   * @internal
   */
  private readonly transceiverInitOrder: TrackType[] = [];

  private readonly trackKindMapping: {
    [key in TrackType]: 'video' | 'audio' | undefined;
  } = {
    [TrackType.AUDIO]: 'audio',
    [TrackType.VIDEO]: 'video',
    [TrackType.SCREEN_SHARE]: 'video',
    [TrackType.SCREEN_SHARE_AUDIO]: 'audio',
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

  private readonly unsubscribeOnIceRestart: () => void;
  private readonly onUnrecoverableError?: () => void;

  private isIceRestarting = false;

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
   * @param dispatcher the dispatcher to use.
   * @param isDtxEnabled whether DTX is enabled.
   * @param isRedEnabled whether RED is enabled.
   * @param iceRestartDelay the delay in milliseconds to wait before restarting ICE once connection goes to `disconnected` state.
   * @param onUnrecoverableError a callback to call when an unrecoverable error occurs.
   * @param logTag the log tag to use.
   */
  constructor({
    connectionConfig,
    sfuClient,
    dispatcher,
    state,
    isDtxEnabled,
    isRedEnabled,
    onUnrecoverableError,
    logTag,
  }: PublisherConstructorOpts) {
    this.logger = getLogger(['Publisher', logTag]);
    this.pc = this.createPeerConnection(connectionConfig);
    this.sfuClient = sfuClient;
    this.state = state;
    this.isDtxEnabled = isDtxEnabled;
    this.isRedEnabled = isRedEnabled;
    this.onUnrecoverableError = onUnrecoverableError;

    this.unsubscribeOnIceRestart = dispatcher.on('iceRestart', (iceRestart) => {
      if (iceRestart.peerType !== PeerType.PUBLISHER_UNSPECIFIED) return;
      this.restartIce().catch((err) => {
        this.logger('warn', `ICERestart failed`, err);
        this.onUnrecoverableError?.();
      });
    });
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
  close = ({ stopTracks }: { stopTracks: boolean }) => {
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

    this.detachEventHandlers();
    this.pc.close();
  };

  /**
   * Detaches the event handlers from the `RTCPeerConnection`.
   * This is useful when we want to replace the `RTCPeerConnection`
   * instance with a new one (in case of migration).
   */
  detachEventHandlers = () => {
    this.unsubscribeOnIceRestart();

    this.pc.removeEventListener('icecandidate', this.onIceCandidate);
    this.pc.removeEventListener('negotiationneeded', this.onNegotiationNeeded);
    this.pc.removeEventListener('icecandidateerror', this.onIceCandidateError);
    this.pc.removeEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange,
    );
    this.pc.removeEventListener(
      'icegatheringstatechange',
      this.onIceGatheringStateChange,
    );
    this.pc.removeEventListener(
      'signalingstatechange',
      this.onSignalingStateChange,
    );
  };

  /**
   * Starts publishing the given track of the given media stream.
   *
   * Consecutive calls to this method will replace the stream.
   * The previous stream will be stopped.
   *
   * @param mediaStream the media stream to publish.
   * @param track the track to publish.
   * @param trackType the track type to publish.
   * @param opts the optional publish options to use.
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
    const handleTrackEnded = () => {
      this.logger(
        'info',
        `Track ${TrackType[trackType]} has ended abruptly, notifying the SFU`,
      );
      // cleanup, this event listener needs to run only once.
      track.removeEventListener('ended', handleTrackEnded);
      this.notifyTrackMuteStateChanged(mediaStream, trackType, true).catch(
        (err) => this.logger('warn', `Couldn't notify track mute state`, err),
      );
    };

    if (!transceiver) {
      const { settings } = this.state;
      const targetResolution = settings?.video
        .target_resolution as TargetResolutionResponse;
      const screenShareBitrate =
        settings?.screensharing.target_resolution?.bitrate;

      const videoEncodings =
        trackType === TrackType.VIDEO
          ? findOptimalVideoLayers(track, targetResolution)
          : trackType === TrackType.SCREEN_SHARE
            ? findOptimalScreenSharingLayers(
                track,
                opts.screenShareSettings,
                screenShareBitrate,
              )
            : undefined;

      let preferredCodec = opts.preferredCodec;
      if (!preferredCodec && trackType === TrackType.VIDEO && isReactNative()) {
        const osName = getOSInfo()?.name.toLowerCase();
        if (osName === 'ipados') {
          // in ipads it was noticed that if vp8 codec is used
          // then the bytes sent is 0 in the outbound-rtp
          // so we are forcing h264 codec for ipads
          preferredCodec = 'H264';
        } else if (osName === 'android') {
          preferredCodec = 'VP8';
        }
      }

      // listen for 'ended' event on the track as it might be ended abruptly
      // by an external factor as permission revokes, device disconnected, etc.
      // keep in mind that `track.stop()` doesn't trigger this event.
      track.addEventListener('ended', handleTrackEnded);
      if (!track.enabled) {
        track.enabled = true;
      }

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
      this.publishOptionsPerTrackType.set(trackType, opts);

      const codecPreferences =
        'setCodecPreferences' in transceiver
          ? this.getCodecPreferences(trackType, preferredCodec)
          : undefined;
      if (codecPreferences) {
        this.logger(
          'info',
          `Setting ${TrackType[trackType]} codec preferences`,
          codecPreferences,
        );
        try {
          transceiver.setCodecPreferences(codecPreferences);
        } catch (err) {
          this.logger('warn', `Couldn't set codec preferences`, err);
        }
      }
    } else {
      const previousTrack = transceiver.sender.track;
      // don't stop the track if we are re-publishing the same track
      if (previousTrack && previousTrack !== track) {
        previousTrack.stop();
        previousTrack.removeEventListener('ended', handleTrackEnded);
        track.addEventListener('ended', handleTrackEnded);
      }
      if (!track.enabled) {
        track.enabled = true;
      }
      await transceiver.sender.replaceTrack(track);
    }

    await this.notifyTrackMuteStateChanged(mediaStream, trackType, false);
  };

  /**
   * Stops publishing the given track type to the SFU, if it is currently being published.
   * Underlying track will be stopped and removed from the publisher.
   * @param trackType the track type to unpublish.
   * @param stopTrack specifies whether track should be stopped or just disabled
   */
  unpublishStream = async (trackType: TrackType, stopTrack: boolean) => {
    const transceiver = this.pc
      .getTransceivers()
      .find((t) => t === this.transceiverRegistry[trackType] && t.sender.track);
    if (
      transceiver &&
      transceiver.sender.track &&
      (stopTrack
        ? transceiver.sender.track.readyState === 'live'
        : transceiver.sender.track.enabled)
    ) {
      stopTrack
        ? transceiver.sender.track.stop()
        : (transceiver.sender.track.enabled = false);
      // We don't need to notify SFU if unpublishing in response to remote soft mute
      if (this.state.localParticipant?.publishedTracks.includes(trackType)) {
        await this.notifyTrackMuteStateChanged(undefined, trackType, true);
      }
    }
  };

  /**
   * Returns true if the given track type is currently being published to the SFU.
   *
   * @param trackType the track type to check.
   */
  isPublishing = (trackType: TrackType): boolean => {
    const transceiver = this.transceiverRegistry[trackType];
    if (!transceiver || !transceiver.sender) return false;
    const track = transceiver.sender.track;
    return !!track && track.readyState === 'live' && track.enabled;
  };

  private notifyTrackMuteStateChanged = async (
    mediaStream: MediaStream | undefined,
    trackType: TrackType,
    isMuted: boolean,
  ) => {
    await this.sfuClient.updateMuteState(trackType, isMuted);

    const audioOrVideoOrScreenShareStream =
      trackTypeToParticipantStreamKey(trackType);
    if (!audioOrVideoOrScreenShareStream) return;
    if (isMuted) {
      this.state.updateParticipant(this.sfuClient.sessionId, (p) => ({
        publishedTracks: p.publishedTracks.filter((t) => t !== trackType),
        [audioOrVideoOrScreenShareStream]: undefined,
      }));
    } else {
      this.state.updateParticipant(this.sfuClient.sessionId, (p) => {
        return {
          publishedTracks: p.publishedTracks.includes(trackType)
            ? p.publishedTracks
            : [...p.publishedTracks, trackType],
          [audioOrVideoOrScreenShareStream]: mediaStream,
        };
      });
    }
  };

  /**
   * Stops publishing all tracks and stop all tracks.
   */
  private stopPublishing = () => {
    this.logger('debug', 'Stopping publishing all tracks');
    this.pc.getSenders().forEach((s) => {
      s.track?.stop();
      if (this.pc.signalingState !== 'closed') {
        this.pc.removeTrack(s);
      }
    });
  };

  updateVideoPublishQuality = async (enabledLayers: VideoLayerSetting[]) => {
    this.logger(
      'info',
      'Update publish quality, requested layers by SFU:',
      enabledLayers,
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
    let enabledRids = enabledLayers
      .filter((ly) => ly.active)
      .map((ly) => ly.name);
    params.encodings.forEach((enc) => {
      // flip 'active' flag only when necessary
      const shouldEnable = enabledRids.includes(enc.rid!);
      if (shouldEnable !== enc.active) {
        enc.active = shouldEnable;
        changed = true;
      }
      if (shouldEnable) {
        let layer = enabledLayers.find((vls) => vls.name === enc.rid);
        if (layer !== undefined) {
          if (
            layer.scaleResolutionDownBy >= 1 &&
            layer.scaleResolutionDownBy !== enc.scaleResolutionDownBy
          ) {
            this.logger(
              'debug',
              '[dynascale]: setting scaleResolutionDownBy from server',
              'layer',
              layer.name,
              'scale-resolution-down-by',
              layer.scaleResolutionDownBy,
            );
            enc.scaleResolutionDownBy = layer.scaleResolutionDownBy;
            changed = true;
          }

          if (layer.maxBitrate > 0 && layer.maxBitrate !== enc.maxBitrate) {
            this.logger(
              'debug',
              '[dynascale] setting max-bitrate from the server',
              'layer',
              layer.name,
              'max-bitrate',
              layer.maxBitrate,
            );
            enc.maxBitrate = layer.maxBitrate;
            changed = true;
          }

          if (
            layer.maxFramerate > 0 &&
            layer.maxFramerate !== enc.maxFramerate
          ) {
            this.logger(
              'debug',
              '[dynascale]: setting maxFramerate from server',
              'layer',
              layer.name,
              'max-framerate',
              layer.maxFramerate,
            );
            enc.maxFramerate = layer.maxFramerate;
            changed = true;
          }
        }
      }
    });

    const activeLayers = params.encodings.filter((e) => e.active);
    if (changed) {
      await videoSender.setParameters(params);
      this.logger(
        'info',
        `Update publish quality, enabled rids: `,
        activeLayers,
      );
    } else {
      this.logger('info', `Update publish quality, no change: `, activeLayers);
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

  private onIceCandidate = (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      this.logger('debug', 'null ice candidate');
      return;
    }
    this.sfuClient
      .iceTrickle({
        iceCandidate: getIceCandidate(candidate),
        peerType: PeerType.PUBLISHER_UNSPECIFIED,
      })
      .catch((err) => {
        this.logger('warn', `ICETrickle failed`, err);
      });
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
    const signalingState = this.pc.signalingState;
    if (this.isIceRestarting || signalingState === 'have-local-offer') {
      this.logger('debug', 'ICE restart is already in progress');
      return;
    }
    await this.negotiate({ iceRestart: true });
  };

  private onNegotiationNeeded = () => {
    this.negotiate().catch((err) => {
      this.logger('error', `Negotiation failed.`, err);
      this.onUnrecoverableError?.();
    });
  };

  /**
   * Initiates a new offer/answer exchange with the currently connected SFU.
   *
   * @param options the optional offer options to use.
   */
  private negotiate = async (options?: RTCOfferOptions) => {
    const offer = await this.pc.createOffer(options);
    let sdp = this.mungeCodecs(offer.sdp);
    if (sdp && this.isPublishing(TrackType.SCREEN_SHARE_AUDIO)) {
      sdp = this.enableHighQualityAudio(sdp);
    }

    // set the munged SDP back to the offer
    offer.sdp = sdp;

    const trackInfos = this.getAnnouncedTracks(offer.sdp);
    if (trackInfos.length === 0) {
      throw new Error(`Can't negotiate without announcing any tracks`);
    }

    this.isIceRestarting = options?.iceRestart ?? false;
    await this.pc.setLocalDescription(offer);

    try {
      const { response } = await this.sfuClient.setPublisher({
        sdp: offer.sdp || '',
        tracks: trackInfos,
      });

      if (response.error) throw new Error(response.error.message);
      await this.pc.setRemoteDescription({ type: 'answer', sdp: response.sdp });
    } finally {
      this.isIceRestarting = false;
    }

    this.sfuClient.iceTrickleBuffer.publisherCandidates.subscribe(
      async (candidate) => {
        try {
          const iceCandidate = JSON.parse(candidate.iceCandidate);
          await this.pc.addIceCandidate(iceCandidate);
        } catch (e) {
          this.logger('warn', `ICE candidate error`, e, candidate);
        }
      },
    );
  };

  private enableHighQualityAudio = (sdp: string) => {
    const transceiver = this.transceiverRegistry[TrackType.SCREEN_SHARE_AUDIO];
    if (!transceiver) return sdp;

    const mid = this.extractMid(transceiver, sdp, TrackType.SCREEN_SHARE_AUDIO);
    return enableHighQualityAudio(sdp, mid);
  };

  private mungeCodecs = (sdp?: string) => {
    if (sdp) {
      sdp = toggleDtx(sdp, this.isDtxEnabled);
    }
    return sdp;
  };

  private extractMid = (
    transceiver: RTCRtpTransceiver,
    sdp: string | undefined,
    trackType: TrackType,
  ): string => {
    if (transceiver.mid) return transceiver.mid;

    if (!sdp) {
      this.logger('warn', 'No SDP found. Returning empty mid');
      return '';
    }

    this.logger(
      'debug',
      `No 'mid' found for track. Trying to find it from the Offer SDP`,
    );

    const track = transceiver.sender.track!;
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
        `No mid found in SDP for track type ${track.kind} and id ${track.id}. Attempting to find it heuristically`,
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

  /**
   * Returns a list of tracks that are currently being published.
   *
   * @internal
   * @param sdp an optional SDP to extract the `mid` from.
   */
  getAnnouncedTracks = (sdp?: string): TrackInfo[] => {
    sdp = sdp || this.pc.localDescription?.sdp;

    const { settings } = this.state;
    const targetResolution = settings?.video
      .target_resolution as TargetResolutionResponse;
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
        const isTrackLive = track.readyState === 'live';
        if (isTrackLive) {
          const publishOpts = this.publishOptionsPerTrackType.get(trackType);
          optimalLayers =
            trackType === TrackType.VIDEO
              ? findOptimalVideoLayers(track, targetResolution)
              : trackType === TrackType.SCREEN_SHARE
                ? findOptimalScreenSharingLayers(
                    track,
                    publishOpts?.screenShareSettings,
                  )
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

        const isAudioTrack = [
          TrackType.AUDIO,
          TrackType.SCREEN_SHARE_AUDIO,
        ].includes(trackType);

        const trackSettings = track.getSettings();
        const isStereo = isAudioTrack && trackSettings.channelCount === 2;

        return {
          trackId: track.id,
          layers: layers,
          trackType,
          mid: this.extractMid(transceiver, sdp, trackType),

          stereo: isStereo,
          dtx: isAudioTrack && this.isDtxEnabled,
          red: isAudioTrack && this.isRedEnabled,
          muted: !isTrackLive,
        };
      });
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

  private onIceConnectionStateChange = () => {
    const state = this.pc.iceConnectionState;
    this.logger('debug', `ICE Connection state changed to`, state);

    if (this.state.callingState === CallingState.RECONNECTING) return;

    if (state === 'failed' || state === 'disconnected') {
      this.logger('debug', `Attempting to restart ICE`);
      this.restartIce().catch((e) => {
        this.logger('error', `ICE restart error`, e);
        this.onUnrecoverableError?.();
      });
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
