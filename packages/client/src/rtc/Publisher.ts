import {
  BasePeerConnection,
  BasePeerConnectionOpts,
} from './BasePeerConnection';
import { TransceiverCache } from './TransceiverCache';
import {
  PeerType,
  PublishOption,
  TrackInfo,
  TrackType,
} from '../gen/video/sfu/models/models';
import { VideoSender } from '../gen/video/sfu/event/events';
import {
  computeVideoLayers,
  toSvcEncodings,
  toVideoLayers,
} from './videoLayers';
import { isSvcCodec } from './codecs';
import { isAudioTrackType } from './helpers/tracks';
import { extractMid } from './helpers/sdp';
import { withoutConcurrency } from '../helpers/concurrency';
import { isReactNative } from '../helpers/platforms';

export type PublisherConstructorOpts = BasePeerConnectionOpts & {
  publishOptions: PublishOption[];
};

/**
 * The `Publisher` is responsible for publishing/unpublishing media streams to/from the SFU
 *
 * @internal
 */
export class Publisher extends BasePeerConnection {
  private readonly transceiverCache = new TransceiverCache();
  private readonly clonedTracks = new Set<MediaStreamTrack>();
  private publishOptions: PublishOption[];

  /**
   * Constructs a new `Publisher` instance.
   */
  constructor({ publishOptions, ...baseOptions }: PublisherConstructorOpts) {
    super(PeerType.PUBLISHER_UNSPECIFIED, baseOptions);
    this.publishOptions = publishOptions;

    this.on('iceRestart', (iceRestart) => {
      if (iceRestart.peerType !== PeerType.PUBLISHER_UNSPECIFIED) return;
      this.restartIce().catch((err) => {
        const reason = `ICE restart failed`;
        this.logger('warn', reason, err);
        this.onUnrecoverableError?.(`${reason}: ${err}`);
      });
    });

    this.on('changePublishQuality', async (event) => {
      for (const videoSender of event.videoSenders) {
        await this.changePublishQuality(videoSender);
      }
    });

    this.on('changePublishOptions', (event) => {
      this.publishOptions = event.publishOptions;
      return this.syncPublishOptions();
    });
  }

  /**
   * Disposes this Publisher instance.
   */
  dispose() {
    super.dispose();
    this.stopAllTracks();
    this.clonedTracks.clear();
  }

  /**
   * Starts publishing the given track of the given media stream.
   *
   * Consecutive calls to this method will replace the stream.
   * The previous stream will be stopped.
   *
   * @param track the track to publish.
   * @param trackType the track type to publish.
   */
  publish = async (track: MediaStreamTrack, trackType: TrackType) => {
    if (!this.publishOptions.some((o) => o.trackType === trackType)) {
      throw new Error(`No publish options found for ${TrackType[trackType]}`);
    }

    for (const publishOption of this.publishOptions) {
      if (publishOption.trackType !== trackType) continue;

      // create a clone of the track as otherwise the same trackId will
      // appear in the SDP in multiple transceivers
      const trackToPublish = this.cloneTrack(track);

      const transceiver = this.transceiverCache.get(publishOption);
      if (!transceiver) {
        await this.addTransceiver(trackToPublish, publishOption);
      } else {
        const previousTrack = transceiver.sender.track;
        await transceiver.sender.replaceTrack(trackToPublish);
        if (!isReactNative()) {
          this.stopTrack(previousTrack);
        }
      }
    }
  };

  /**
   * Adds a new transceiver carrying the given track to the peer connection.
   */
  private addTransceiver = async (
    track: MediaStreamTrack,
    publishOption: PublishOption,
  ) => {
    const videoEncodings = computeVideoLayers(track, publishOption);
    const sendEncodings = isSvcCodec(publishOption.codec?.name)
      ? toSvcEncodings(videoEncodings)
      : videoEncodings;
    const transceiver = this.pc.addTransceiver(track, {
      direction: 'sendonly',
      sendEncodings,
    });

    const trackType = publishOption.trackType;
    this.logger('debug', `Added ${TrackType[trackType]} transceiver`);
    this.transceiverCache.add(publishOption, transceiver);

    await this.negotiate();
  };

  /**
   * Synchronizes the current Publisher state with the provided publish options.
   */
  private syncPublishOptions = async () => {
    // enable publishing with new options -> [av1, vp9]
    for (const publishOption of this.publishOptions) {
      const { trackType } = publishOption;
      if (!this.isPublishing(trackType)) continue;
      if (this.transceiverCache.has(publishOption)) continue;

      const item = this.transceiverCache.find(
        (i) =>
          !!i.transceiver.sender.track &&
          i.publishOption.trackType === trackType,
      );
      if (!item || !item.transceiver) continue;

      // take the track from the existing transceiver for the same track type,
      // clone it and publish it with the new publish options
      const track = this.cloneTrack(item.transceiver.sender.track!);
      await this.addTransceiver(track, publishOption);
    }

    // stop publishing with options not required anymore -> [vp9]
    for (const item of this.transceiverCache.items()) {
      const { publishOption, transceiver } = item;
      const hasPublishOption = this.publishOptions.some(
        (option) =>
          option.id === publishOption.id &&
          option.trackType === publishOption.trackType,
      );
      if (hasPublishOption) continue;
      // it is safe to stop the track here, it is a clone
      this.stopTrack(transceiver.sender.track);
      await transceiver.sender.replaceTrack(null);
    }
  };

  /**
   * Returns true if the given track type is currently being published to the SFU.
   *
   * @param trackType the track type to check.
   */
  isPublishing = (trackType: TrackType): boolean => {
    for (const item of this.transceiverCache.items()) {
      if (item.publishOption.trackType !== trackType) continue;

      const track = item.transceiver.sender.track;
      if (!track) continue;

      if (track.readyState === 'live' && track.enabled) return true;
    }
    return false;
  };

  /**
   * Maps the given track ID to the corresponding track type.
   */
  getTrackType = (trackId: string): TrackType | undefined => {
    for (const transceiverId of this.transceiverCache.items()) {
      const { publishOption, transceiver } = transceiverId;
      if (transceiver.sender.track?.id === trackId) {
        return publishOption.trackType;
      }
    }
    return undefined;
  };

  /**
   * Stops the cloned track that is being published to the SFU.
   */
  stopTracks = (...trackTypes: TrackType[]) => {
    for (const item of this.transceiverCache.items()) {
      const { publishOption, transceiver } = item;
      if (!trackTypes.includes(publishOption.trackType)) continue;
      this.stopTrack(transceiver.sender.track);
    }
  };

  /**
   * Stops all the cloned tracks that are being published to the SFU.
   */
  stopAllTracks = () => {
    for (const { transceiver } of this.transceiverCache.items()) {
      this.stopTrack(transceiver.sender.track);
    }
    for (const track of this.clonedTracks) {
      this.stopTrack(track);
    }
  };

  private changePublishQuality = async (videoSender: VideoSender) => {
    const { trackType, layers, publishOptionId } = videoSender;
    const enabledLayers = layers.filter((l) => l.active);

    const tag = 'Update publish quality:';
    this.logger('info', `${tag} requested layers by SFU:`, enabledLayers);

    const transceiverId = this.transceiverCache.find(
      (t) =>
        t.publishOption.id === publishOptionId &&
        t.publishOption.trackType === trackType,
    );
    const sender = transceiverId?.transceiver.sender;
    if (!sender) {
      return this.logger('warn', `${tag} no video sender found.`);
    }

    const params = sender.getParameters();
    if (params.encodings.length === 0) {
      return this.logger('warn', `${tag} there are no encodings set.`);
    }

    const codecInUse = transceiverId?.publishOption.codec?.name;
    const usesSvcCodec = codecInUse && isSvcCodec(codecInUse);

    let changed = false;
    for (const encoder of params.encodings) {
      const layer = usesSvcCodec
        ? // for SVC, we only have one layer (q) and often rid is omitted
          enabledLayers[0]
        : // for non-SVC, we need to find the layer by rid (simulcast)
          (enabledLayers.find((l) => l.name === encoder.rid) ??
          (params.encodings.length === 1 ? enabledLayers[0] : undefined));

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

    const activeEncoders = params.encodings.filter((e) => e.active);
    if (!changed) {
      return this.logger('info', `${tag} no change:`, activeEncoders);
    }

    await sender.setParameters(params);
    this.logger('info', `${tag} enabled rids:`, activeEncoders);
  };

  /**
   * Restarts the ICE connection and renegotiates with the SFU.
   */
  restartIce = async (): Promise<void> => {
    this.logger('debug', 'Restarting ICE connection');
    const signalingState = this.pc.signalingState;
    if (this.isIceRestarting || signalingState === 'have-local-offer') {
      this.logger('debug', 'ICE restart is already in progress');
      return;
    }
    await this.negotiate({ iceRestart: true });
  };

  /**
   * Initiates a new offer/answer exchange with the currently connected SFU.
   *
   * @param options the optional offer options to use.
   */
  private negotiate = async (options?: RTCOfferOptions): Promise<void> => {
    return withoutConcurrency('publisher.negotiate', async () => {
      const offer = await this.pc.createOffer(options);
      const tracks = this.getAnnouncedTracks(offer.sdp);
      if (!tracks.length) throw new Error(`Can't negotiate without any tracks`);

      try {
        this.isIceRestarting = options?.iceRestart ?? false;
        await this.pc.setLocalDescription(offer);

        const { sdp = '' } = offer;
        const { response } = await this.sfuClient.setPublisher({ sdp, tracks });
        if (response.error) throw new Error(response.error.message);

        const { sdp: answerSdp } = response;
        await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      } finally {
        this.isIceRestarting = false;
      }

      this.addTrickledIceCandidates();
    });
  };

  /**
   * Returns a list of tracks that are currently being published.
   */
  getPublishedTracks = (): MediaStreamTrack[] => {
    const tracks: MediaStreamTrack[] = [];
    for (const { transceiver } of this.transceiverCache.items()) {
      const track = transceiver.sender.track;
      if (track && track.readyState === 'live') tracks.push(track);
    }
    return tracks;
  };

  /**
   * Returns a list of tracks that are currently being published.
   * @param sdp an optional SDP to extract the `mid` from.
   */
  getAnnouncedTracks = (sdp: string | undefined): TrackInfo[] => {
    const trackInfos: TrackInfo[] = [];
    for (const bundle of this.transceiverCache.items()) {
      const { transceiver, publishOption } = bundle;
      const track = transceiver.sender.track;
      if (!track) continue;

      trackInfos.push(this.toTrackInfo(transceiver, publishOption, sdp));
    }
    return trackInfos;
  };

  /**
   * Returns a list of tracks that are currently being published.
   * This method shall be used for the reconnection flow.
   * There we shouldn't announce the tracks that have been stopped due to a codec switch.
   */
  getAnnouncedTracksForReconnect = (): TrackInfo[] => {
    const sdp = this.pc.localDescription?.sdp;
    const trackInfos: TrackInfo[] = [];
    for (const publishOption of this.publishOptions) {
      const transceiver = this.transceiverCache.get(publishOption);
      if (!transceiver || !transceiver.sender.track) continue;

      trackInfos.push(this.toTrackInfo(transceiver, publishOption, sdp));
    }
    return trackInfos;
  };

  /**
   * Converts the given transceiver to a `TrackInfo` object.
   */
  private toTrackInfo = (
    transceiver: RTCRtpTransceiver,
    publishOption: PublishOption,
    sdp: string | undefined,
  ): TrackInfo => {
    const track = transceiver.sender.track!;
    const isTrackLive = track.readyState === 'live';
    const layers = isTrackLive
      ? computeVideoLayers(track, publishOption)
      : this.transceiverCache.getLayers(publishOption);
    this.transceiverCache.setLayers(publishOption, layers);

    const isAudioTrack = isAudioTrackType(publishOption.trackType);
    const isStereo = isAudioTrack && track.getSettings().channelCount === 2;
    const transceiverIndex = this.transceiverCache.indexOf(transceiver);
    const audioSettings = this.state.settings?.audio;

    return {
      trackId: track.id,
      layers: toVideoLayers(layers),
      trackType: publishOption.trackType,
      mid: extractMid(transceiver, transceiverIndex, sdp),
      stereo: isStereo,
      dtx: isAudioTrack && !!audioSettings?.opus_dtx_enabled,
      red: isAudioTrack && !!audioSettings?.redundant_coding_enabled,
      muted: !isTrackLive,
      codec: publishOption.codec,
      publishOptionId: publishOption.id,
    };
  };

  private cloneTrack = (track: MediaStreamTrack): MediaStreamTrack => {
    const clone = track.clone();
    this.clonedTracks.add(clone);
    return clone;
  };

  private stopTrack = (track: MediaStreamTrack | null | undefined) => {
    if (!track) return;
    track.stop();
    this.clonedTracks.delete(track);
  };
}
