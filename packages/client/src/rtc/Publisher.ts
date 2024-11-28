import { StreamSfuClient } from '../StreamSfuClient';
import {
  PeerType,
  TrackInfo,
  TrackType,
  VideoLayer,
} from '../gen/video/sfu/models/models';
import { getIceCandidate } from './helpers/iceCandidate';
import {
  findOptimalScreenSharingLayers,
  findOptimalVideoLayers,
  OptimalVideoLayer,
  ridToVideoQuality,
  toSvcEncodings,
} from './videoLayers';
import { getOptimalVideoCodec, getPreferredCodecs, isSvcCodec } from './codecs';
import { trackTypeToParticipantStreamKey } from './helpers/tracks';
import { CallingState, CallState } from '../store';
import { PublishOptions } from '../types';
import {
  enableHighQualityAudio,
  extractMid,
  preserveCodec,
  toggleDtx,
} from '../helpers/sdp-munging';
import { Logger } from '../coordinator/connection/types';
import { getLogger } from '../logger';
import { Dispatcher } from './Dispatcher';
import { VideoLayerSetting } from '../gen/video/sfu/event/events';
import { TargetResolutionResponse } from '../gen/shims';
import { withoutConcurrency } from '../helpers/concurrency';
import { isReactNative } from '../helpers/platforms';
import { isFirefox } from '../helpers/browsers';

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
  private readonly transceiverCache = new Map<TrackType, RTCRtpTransceiver>();
  private readonly trackLayersCache = new Map<TrackType, OptimalVideoLayer[]>();
  private readonly publishOptsForTrack = new Map<TrackType, PublishOptions>();

  /**
   * An array maintaining the order how transceivers were added to the peer connection.
   * This is needed because some browsers (Firefox) don't reliably report
   * trackId and `mid` parameters.
   *
   * @internal
   */
  private readonly transceiverInitOrder: TrackType[] = [];
  private readonly isDtxEnabled: boolean;
  private readonly isRedEnabled: boolean;

  private readonly unsubscribeOnIceRestart: () => void;
  private readonly unsubscribeChangePublishQuality: () => void;
  private readonly onUnrecoverableError?: () => void;

  private isIceRestarting = false;
  private sfuClient: StreamSfuClient;

  /**
   * Constructs a new `Publisher` instance.
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

    this.unsubscribeChangePublishQuality = dispatcher.on(
      'changePublishQuality',
      ({ videoSenders }) => {
        withoutConcurrency('publisher.changePublishQuality', async () => {
          for (const videoSender of videoSenders) {
            const { layers } = videoSender;
            const enabledLayers = layers.filter((l) => l.active);
            await this.changePublishQuality(enabledLayers);
          }
        }).catch((err) => {
          this.logger('warn', 'Failed to change publish quality', err);
        });
      },
    );
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
      this.transceiverCache.clear();
      this.trackLayersCache.clear();
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
    this.unsubscribeChangePublishQuality();

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

    // enable the track if it is disabled
    if (!track.enabled) track.enabled = true;

    const transceiver = this.transceiverCache.get(trackType);
    if (!transceiver || !transceiver.sender.track) {
      // listen for 'ended' event on the track as it might be ended abruptly
      // by an external factors such as permission revokes, a disconnected device, etc.
      // keep in mind that `track.stop()` doesn't trigger this event.
      const handleTrackEnded = () => {
        this.logger('info', `Track ${TrackType[trackType]} has ended abruptly`);
        track.removeEventListener('ended', handleTrackEnded);
        this.notifyTrackMuteStateChanged(mediaStream, trackType, true).catch(
          (err) => this.logger('warn', `Couldn't notify track mute state`, err),
        );
      };
      track.addEventListener('ended', handleTrackEnded);
      this.addTransceiver(trackType, track, opts, mediaStream);
    } else {
      await this.updateTransceiver(transceiver, track);
    }

    await this.notifyTrackMuteStateChanged(mediaStream, trackType, false);
  };

  /**
   * Adds a new transceiver to the peer connection.
   * This needs to be called when a new track kind is added to the peer connection.
   * In other cases, use `updateTransceiver` method.
   */
  private addTransceiver = (
    trackType: TrackType,
    track: MediaStreamTrack,
    opts: PublishOptions,
    mediaStream: MediaStream,
  ) => {
    const { forceCodec, preferredCodec } = opts;
    const codecInUse = forceCodec || getOptimalVideoCodec(preferredCodec);
    const videoEncodings = this.computeLayers(trackType, track, opts);
    const transceiver = this.pc.addTransceiver(track, {
      direction: 'sendonly',
      streams:
        trackType === TrackType.VIDEO || trackType === TrackType.SCREEN_SHARE
          ? [mediaStream]
          : undefined,
      sendEncodings: isSvcCodec(codecInUse)
        ? toSvcEncodings(videoEncodings)
        : videoEncodings,
    });

    this.logger('debug', `Added ${TrackType[trackType]} transceiver`);
    this.transceiverInitOrder.push(trackType);
    this.transceiverCache.set(trackType, transceiver);
    this.publishOptsForTrack.set(trackType, opts);

    // handle codec preferences
    if (!('setCodecPreferences' in transceiver)) return;

    const codecPreferences = this.getCodecPreferences(
      trackType,
      trackType === TrackType.VIDEO ? codecInUse : undefined,
      'receiver',
    );
    if (!codecPreferences) return;

    try {
      this.logger(
        'info',
        `Setting ${TrackType[trackType]} codec preferences`,
        codecPreferences,
      );
      transceiver.setCodecPreferences(codecPreferences);
    } catch (err) {
      this.logger('warn', `Couldn't set codec preferences`, err);
    }
  };

  /**
   * Updates the given transceiver with the new track.
   * Stops the previous track and replaces it with the new one.
   */
  private updateTransceiver = async (
    transceiver: RTCRtpTransceiver,
    track: MediaStreamTrack,
  ) => {
    const previousTrack = transceiver.sender.track;
    // don't stop the track if we are re-publishing the same track
    if (previousTrack && previousTrack !== track) {
      previousTrack.stop();
    }
    await transceiver.sender.replaceTrack(track);
  };

  /**
   * Stops publishing the given track type to the SFU, if it is currently being published.
   * Underlying track will be stopped and removed from the publisher.
   * @param trackType the track type to unpublish.
   * @param stopTrack specifies whether track should be stopped or just disabled
   */
  unpublishStream = async (trackType: TrackType, stopTrack: boolean) => {
    const transceiver = this.transceiverCache.get(trackType);
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
    const transceiver = this.transceiverCache.get(trackType);
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

  private changePublishQuality = async (enabledLayers: VideoLayerSetting[]) => {
    this.logger(
      'info',
      'Update publish quality, requested layers by SFU:',
      enabledLayers,
    );

    const videoSender = this.transceiverCache.get(TrackType.VIDEO)?.sender;
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

    const [codecInUse] = params.codecs;
    const usesSvcCodec = codecInUse && isSvcCodec(codecInUse.mimeType);

    let changed = false;
    for (const encoder of params.encodings) {
      const layer = usesSvcCodec
        ? // for SVC, we only have one layer (q) and often rid is omitted
          enabledLayers[0]
        : // for non-SVC, we need to find the layer by rid (simulcast)
          enabledLayers.find((l) => l.name === encoder.rid) ??
          (params.encodings.length === 1 ? enabledLayers[0] : undefined);

      // flip 'active' flag only when necessary
      const shouldActivate = !!layer?.active;
      if (shouldActivate !== encoder.active) {
        encoder.active = shouldActivate;
        changed = true;
      }

      // skip the rest of the settings if the layer is disabled or not found
      if (!layer) continue;

      const {
        maxFramerate,
        scaleResolutionDownBy,
        maxBitrate,
        scalabilityMode,
      } = layer;
      if (
        scaleResolutionDownBy >= 1 &&
        scaleResolutionDownBy !== encoder.scaleResolutionDownBy
      ) {
        encoder.scaleResolutionDownBy = scaleResolutionDownBy;
        changed = true;
      }
      if (maxBitrate > 0 && maxBitrate !== encoder.maxBitrate) {
        encoder.maxBitrate = maxBitrate;
        changed = true;
      }
      if (maxFramerate > 0 && maxFramerate !== encoder.maxFramerate) {
        encoder.maxFramerate = maxFramerate;
        changed = true;
      }
      // @ts-expect-error scalabilityMode is not in the typedefs yet
      if (scalabilityMode && scalabilityMode !== encoder.scalabilityMode) {
        // @ts-expect-error scalabilityMode is not in the typedefs yet
        encoder.scalabilityMode = scalabilityMode;
        changed = true;
      }
    }

    const activeLayers = params.encodings.filter((e) => e.active);
    if (!changed) {
      this.logger('info', `Update publish quality, no change:`, activeLayers);
      return;
    }

    await videoSender.setParameters(params);
    this.logger('info', `Update publish quality, enabled rids:`, activeLayers);
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
    preferredCodec: string | undefined,
    codecPreferencesSource: 'sender' | 'receiver',
  ) => {
    if (trackType === TrackType.VIDEO) {
      return getPreferredCodecs(
        'video',
        preferredCodec || 'vp8',
        undefined,
        codecPreferencesSource,
      );
    }
    if (trackType === TrackType.AUDIO) {
      const defaultAudioCodec = this.isRedEnabled ? 'red' : 'opus';
      const codecToRemove = !this.isRedEnabled ? 'red' : undefined;
      return getPreferredCodecs(
        'audio',
        preferredCodec ?? defaultAudioCodec,
        codecToRemove,
        codecPreferencesSource,
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
    if (offer.sdp) {
      offer.sdp = toggleDtx(offer.sdp, this.isDtxEnabled);
      if (this.isPublishing(TrackType.SCREEN_SHARE_AUDIO)) {
        offer.sdp = this.enableHighQualityAudio(offer.sdp);
      }
      if (this.isPublishing(TrackType.VIDEO)) {
        // Hotfix for platforms that don't respect the ordered codec list
        // (Firefox, Android, Linux, etc...).
        // We remove all the codecs from the SDP except the one we want to use.
        offer.sdp = this.removeUnpreferredCodecs(offer.sdp, TrackType.VIDEO);
      }
    }

    const trackInfos = this.getAnnouncedTracks(offer.sdp);
    if (trackInfos.length === 0) {
      throw new Error(`Can't negotiate without announcing any tracks`);
    }

    try {
      this.isIceRestarting = options?.iceRestart ?? false;
      await this.pc.setLocalDescription(offer);

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

  private removeUnpreferredCodecs(sdp: string, trackType: TrackType): string {
    const opts = this.publishOptsForTrack.get(trackType);
    const forceSingleCodec =
      !!opts?.forceSingleCodec || isReactNative() || isFirefox();
    if (!opts || !forceSingleCodec) return sdp;

    const codec = opts.forceCodec || getOptimalVideoCodec(opts.preferredCodec);
    const orderedCodecs = this.getCodecPreferences(trackType, codec, 'sender');
    if (!orderedCodecs || orderedCodecs.length === 0) return sdp;

    const transceiver = this.transceiverCache.get(trackType);
    if (!transceiver) return sdp;

    const index = this.transceiverInitOrder.indexOf(trackType);
    const mid = extractMid(transceiver, index, sdp);
    const [codecToPreserve] = orderedCodecs;
    return preserveCodec(sdp, mid, codecToPreserve);
  }

  private enableHighQualityAudio = (sdp: string) => {
    const transceiver = this.transceiverCache.get(TrackType.SCREEN_SHARE_AUDIO);
    if (!transceiver) return sdp;

    const transceiverInitIndex = this.transceiverInitOrder.indexOf(
      TrackType.SCREEN_SHARE_AUDIO,
    );
    const mid = extractMid(transceiver, transceiverInitIndex, sdp);
    return enableHighQualityAudio(sdp, mid);
  };

  /**
   * Returns a list of tracks that are currently being published.
   *
   * @internal
   * @param sdp an optional SDP to extract the `mid` from.
   */
  getAnnouncedTracks = (sdp?: string): TrackInfo[] => {
    sdp = sdp || this.pc.localDescription?.sdp;
    return this.pc
      .getTransceivers()
      .filter((t) => t.direction === 'sendonly' && t.sender.track)
      .map<TrackInfo>((transceiver) => {
        let trackType!: TrackType;
        this.transceiverCache.forEach((value, key) => {
          if (value === transceiver) trackType = key;
        });
        const track = transceiver.sender.track!;
        let optimalLayers: OptimalVideoLayer[];
        const isTrackLive = track.readyState === 'live';
        if (isTrackLive) {
          optimalLayers = this.computeLayers(trackType, track) || [];
          this.trackLayersCache.set(trackType, optimalLayers);
        } else {
          // we report the last known optimal layers for ended tracks
          optimalLayers = this.trackLayersCache.get(trackType) || [];
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
          quality: ridToVideoQuality(optimalLayer.rid || ''),
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
        const transceiverInitIndex =
          this.transceiverInitOrder.indexOf(trackType);
        return {
          trackId: track.id,
          layers: layers,
          trackType,
          mid: extractMid(transceiver, transceiverInitIndex, sdp),
          stereo: isStereo,
          dtx: isAudioTrack && this.isDtxEnabled,
          red: isAudioTrack && this.isRedEnabled,
          muted: !isTrackLive,
        };
      });
  };

  private computeLayers = (
    trackType: TrackType,
    track: MediaStreamTrack,
    opts?: PublishOptions,
  ): OptimalVideoLayer[] | undefined => {
    const { settings } = this.state;
    const targetResolution = settings?.video
      .target_resolution as TargetResolutionResponse;
    const screenShareBitrate =
      settings?.screensharing.target_resolution?.bitrate;

    const publishOpts = opts || this.publishOptsForTrack.get(trackType);
    const codecInUse =
      opts?.forceCodec || getOptimalVideoCodec(opts?.preferredCodec);
    return trackType === TrackType.VIDEO
      ? findOptimalVideoLayers(track, targetResolution, codecInUse, publishOpts)
      : trackType === TrackType.SCREEN_SHARE
        ? findOptimalScreenSharingLayers(track, publishOpts, screenShareBitrate)
        : undefined;
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
}
