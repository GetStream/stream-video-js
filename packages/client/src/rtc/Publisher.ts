import {
  BasePeerConnection,
  BasePeerConnectionOpts,
} from './BasePeerConnection';
import {
  PeerType,
  PublishOption,
  TrackInfo,
  TrackType,
  VideoLayer,
} from '../gen/video/sfu/models/models';
import {
  findOptimalScreenSharingLayers,
  findOptimalVideoLayers,
  OptimalVideoLayer,
  ridToVideoQuality,
  toSvcEncodings,
} from './videoLayers';
import { isSvcCodec } from './codecs';
import { trackTypeToParticipantStreamKey } from './helpers/tracks';
import { enableHighQualityAudio, extractMid } from '../helpers/sdp-munging';
import { VideoLayerSetting } from '../gen/video/sfu/event/events';
import { TargetResolutionResponse } from '../gen/shims';
import { withoutConcurrency } from '../helpers/concurrency';

export type PublisherConstructorOpts = BasePeerConnectionOpts & {
  publishOptions: PublishOption[];
};

/**
 * The `Publisher` is responsible for publishing/unpublishing media streams to/from the SFU
 *
 * @internal
 */
export class Publisher extends BasePeerConnection {
  private readonly transceiverCache = new Map<TrackType, RTCRtpTransceiver>();
  private readonly trackLayersCache = new Map<TrackType, OptimalVideoLayer[]>();

  /**
   * An array maintaining the order how transceivers were added to the peer connection.
   * This is needed because some browsers (Firefox) don't reliably report
   * trackId and `mid` parameters.
   */
  private readonly transceiverOrder: RTCRtpTransceiver[] = [];

  private readonly unsubscribeOnIceRestart: () => void;
  private readonly unsubscribeChangePublishQuality: () => void;
  private readonly unsubscribeChangePublishOptions: () => void;
  private unsubscribeCodecNegotiationComplete?: () => void;

  private publishOptions: PublishOption[];

  /**
   * Constructs a new `Publisher` instance.
   */
  constructor({ publishOptions, ...baseOptions }: PublisherConstructorOpts) {
    super(PeerType.PUBLISHER_UNSPECIFIED, baseOptions);
    this.publishOptions = publishOptions;
    this.pc.addEventListener('negotiationneeded', this.onNegotiationNeeded);

    this.unsubscribeOnIceRestart = this.dispatcher.on(
      'iceRestart',
      (iceRestart) => {
        if (iceRestart.peerType !== PeerType.PUBLISHER_UNSPECIFIED) return;
        this.restartIce().catch((err) => {
          this.logger('warn', `ICERestart failed`, err);
          this.onUnrecoverableError?.();
        });
      },
    );

    this.unsubscribeChangePublishQuality = this.dispatcher.on(
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

    this.unsubscribeChangePublishOptions = this.dispatcher.on(
      'changePublishOptions',
      ({ publishOption }) => {
        withoutConcurrency('publisher.changePublishOptions', async () => {
          if (!publishOption) return;
          this.publishOptions = this.publishOptions.map((option) =>
            option.trackType === publishOption.trackType
              ? publishOption
              : option,
          );
          if (this.isPublishing(publishOption.trackType)) {
            this.switchCodec(publishOption);
          }
        }).catch((err) => {
          this.logger('warn', 'Failed to change publish options', err);
        });
      },
    );
  }

  /**
   * Closes the publisher PeerConnection and cleans up the resources.
   */
  close = ({ stopTracks }: { stopTracks: boolean }) => {
    if (stopTracks) {
      this.stopPublishing();
      this.transceiverCache.clear();
      this.trackLayersCache.clear();
    }

    this.dispose();
  };

  /**
   * Detaches the event handlers from the `RTCPeerConnection`.
   * This is useful when we want to replace the `RTCPeerConnection`
   * instance with a new one (in case of migration).
   */
  detachEventHandlers() {
    this.unsubscribeOnIceRestart();
    this.unsubscribeChangePublishQuality();
    this.unsubscribeChangePublishOptions();
    this.unsubscribeCodecNegotiationComplete?.();

    super.detachEventHandlers();
    this.pc.removeEventListener('negotiationneeded', this.onNegotiationNeeded);
  }

  /**
   * Starts publishing the given track of the given media stream.
   *
   * Consecutive calls to this method will replace the stream.
   * The previous stream will be stopped.
   *
   * @param mediaStream the media stream to publish.
   * @param track the track to publish.
   * @param trackType the track type to publish.
   */
  publishStream = async (
    mediaStream: MediaStream,
    track: MediaStreamTrack,
    trackType: TrackType,
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
      const publishOption = this.getPublishOptionFor(trackType);
      this.addTransceiver(trackType, track, publishOption);
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
    publishOption: PublishOption,
  ) => {
    const videoEncodings = this.computeLayers(trackType, track, publishOption);
    const sendEncodings = isSvcCodec(publishOption.codec?.name)
      ? toSvcEncodings(videoEncodings)
      : videoEncodings;
    const transceiver = this.pc.addTransceiver(track, {
      direction: 'sendonly',
      sendEncodings,
    });

    this.logger('debug', `Added ${TrackType[trackType]} transceiver`);
    this.transceiverOrder.push(transceiver);
    this.transceiverCache.set(trackType, transceiver);
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
   * Switches the codec of the given track type.
   */
  private switchCodec = (publishOption: PublishOption) => {
    const trackType = publishOption.trackType;
    const transceiver = this.transceiverCache.get(trackType);
    if (!transceiver || !transceiver.sender.track) return;

    const onNegotiationComplete = async () => {
      this.logger('info', 'Codec negotiation complete');
      this.dispatcher.off('codecNegotiationComplete', onNegotiationComplete);

      await transceiver.sender.replaceTrack(null);
    };
    this.unsubscribeCodecNegotiationComplete?.();
    this.unsubscribeCodecNegotiationComplete = this.dispatcher.on(
      'codecNegotiationComplete',
      onNegotiationComplete,
    );

    const track = transceiver.sender.track.clone();
    this.addTransceiver(trackType, track, publishOption);
  };

  /**
   * Stops publishing the given track type to the SFU, if it is currently being published.
   * Underlying track will be stopped and removed from the publisher.
   * @param trackType the track type to unpublish.
   * @param stopTrack specifies whether track should be stopped or just disabled
   */
  unpublishStream = async (trackType: TrackType, stopTrack: boolean) => {
    const transceiver = this.transceiverCache.get(trackType);
    if (!transceiver || !transceiver.sender.track) return;

    if (stopTrack && transceiver.sender.track.readyState === 'live') {
      transceiver.sender.track.stop();
    } else if (transceiver.sender.track.enabled) {
      transceiver.sender.track.enabled = false;
    }

    if (this.state.localParticipant?.publishedTracks.includes(trackType)) {
      await this.notifyTrackMuteStateChanged(undefined, trackType, true);
    }
  };

  /**
   * Returns true if the given track type is currently being published to the SFU.
   *
   * @param trackType the track type to check.
   */
  isPublishing = (trackType: TrackType): boolean => {
    const transceiver = this.transceiverCache.get(trackType);
    if (!transceiver || !transceiver.sender.track) return false;
    const track = transceiver.sender.track;
    return track.readyState === 'live' && track.enabled;
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

    const trackType = TrackType.VIDEO;
    const videoSender = this.transceiverCache.get(trackType)?.sender;
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
    withoutConcurrency('publisher.negotiate', () => this.negotiate()).catch(
      (err) => {
        this.logger('error', `Negotiation failed.`, err);
        this.onUnrecoverableError?.();
      },
    );
  };

  /**
   * Initiates a new offer/answer exchange with the currently connected SFU.
   *
   * @param options the optional offer options to use.
   */
  private negotiate = async (options?: RTCOfferOptions) => {
    const offer = await this.pc.createOffer(options);
    if (offer.sdp && this.isPublishing(TrackType.SCREEN_SHARE_AUDIO)) {
      offer.sdp = this.enableHighQualityAudio(offer.sdp);
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

  private enableHighQualityAudio = (sdp: string) => {
    const transceiver = this.transceiverCache.get(TrackType.SCREEN_SHARE_AUDIO);
    if (!transceiver) return sdp;

    const transceiverInitIndex = this.transceiverOrder.indexOf(transceiver);
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
      .map<TrackInfo | undefined>((transceiver) => {
        let trackType!: TrackType;
        this.transceiverCache.forEach((value, key) => {
          if (value === transceiver) trackType = key;
        });

        if (!trackType) return undefined;
        const track = transceiver.sender.track!;

        const publishOption = this.getPublishOptionFor(trackType);
        const isTrackLive = track.readyState === 'live';
        const optimalLayers = isTrackLive
          ? this.computeLayers(trackType, track, publishOption) || []
          : this.trackLayersCache.get(trackType) || [];
        this.trackLayersCache.set(trackType, optimalLayers);

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

        const isAudioTrack =
          trackType === TrackType.AUDIO ||
          trackType === TrackType.SCREEN_SHARE_AUDIO;

        const audioSettings = this.state.settings?.audio;
        const isDtxEnabled = !!audioSettings?.opus_dtx_enabled;
        const isRedEnabled = !!audioSettings?.redundant_coding_enabled;

        const trackSettings = track.getSettings();
        const isStereo = isAudioTrack && trackSettings.channelCount === 2;
        const transceiverIndex = this.transceiverOrder.indexOf(transceiver);
        const mid =
          String(transceiverIndex) ||
          extractMid(transceiver, transceiverIndex, sdp);

        return {
          trackId: track.id,
          layers,
          trackType,
          mid,
          stereo: isStereo,
          dtx: isAudioTrack && isDtxEnabled,
          red: isAudioTrack && isRedEnabled,
          muted: !isTrackLive,
        };
      })
      .filter(Boolean) as TrackInfo[];
  };

  private getPublishOptionFor = (trackType: TrackType) => {
    const publishOption = this.publishOptions.find(
      (option) => option.trackType === trackType,
    );
    if (!publishOption) {
      throw new Error(`No publish options found for ${TrackType[trackType]}`);
    }
    return publishOption;
  };

  private computeLayers = (
    trackType: TrackType,
    track: MediaStreamTrack,
    opts: PublishOption,
  ): OptimalVideoLayer[] | undefined => {
    const { settings } = this.state;
    const targetResolution = settings?.video
      .target_resolution as TargetResolutionResponse;

    return trackType === TrackType.VIDEO
      ? findOptimalVideoLayers(track, targetResolution, opts)
      : trackType === TrackType.SCREEN_SHARE
        ? findOptimalScreenSharingLayers(track, undefined, opts.bitrate)
        : undefined;
  };
}
