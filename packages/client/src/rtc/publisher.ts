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
  findOptimalVideoLayers,
  findOptimalScreenSharingLayers,
} from './videoLayers';
import { getPreferredCodecs } from './codecs';
import { PublishOptions } from './types';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
  isDtxEnabled: boolean;
};

/**
 * @internal
 * The `Publisher` is responsible for publishing/unpublishing media streams to/from the SFU
 */
export class Publisher {
  private readonly publisher: RTCPeerConnection;
  private readonly rpcClient: StreamSfuClient;
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
  private isDtxEnabled: boolean;

  constructor({ connectionConfig, rpcClient, isDtxEnabled }: PublisherOpts) {
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
    this.rpcClient = rpcClient;
    this.isDtxEnabled = isDtxEnabled;
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

    if (!transceiver) {
      let videoEncodings: RTCRtpEncodingParameters[] | undefined;
      if (trackType === TrackType.VIDEO) {
        videoEncodings = findOptimalVideoLayers(track);
      }
      transceiver = this.publisher.addTransceiver(track, {
        direction: 'sendonly',
        streams:
          trackType === TrackType.VIDEO || trackType === TrackType.SCREEN_SHARE
            ? [mediaStream]
            : undefined,
        sendEncodings:
          trackType === TrackType.VIDEO ? videoEncodings : undefined,
      });

      this.transceiverRegistry[trackType] = transceiver;

      if (trackType === TrackType.VIDEO) {
        const codecPreferences = getPreferredCodecs(
          'video',
          opts.preferredCodec || 'vp8',
        );

        if ('setCodecPreferences' in transceiver && codecPreferences) {
          console.log(`set codec preferences`, codecPreferences);
          // @ts-ignore
          transceiver.setCodecPreferences(codecPreferences);
        }
      }

      if (trackType === TrackType.AUDIO) {
        let returnOnlyMatched = opts.preferredCodec === 'opus';
        const codecPreferences = getPreferredCodecs(
          'audio',
          opts.preferredCodec!,
          returnOnlyMatched,
        );
        console.log('Preferred codec', opts.preferredCodec);
        if ('setCodecPreferences' in transceiver && codecPreferences) {
          console.log(`set codec preferences`, codecPreferences);
          // @ts-ignore
          transceiver.setCodecPreferences(codecPreferences);
        }
      }
    } else {
      transceiver.sender.track?.stop();
      await transceiver.sender.replaceTrack(track);
    }
  };

  /**
   * Stops publishing the given track type to the SFU, if it is currently being published.
   * Underlying track will be stopped and removed from the publisher.
   * @param trackType
   * @returns `true` if track with the given track type was found, otherwise `false`
   */
  unpublishStream = (trackType: TrackType) => {
    const transceiver = this.publisher
      .getTransceivers()
      .find((t) => t === this.transceiverRegistry[trackType] && t.sender.track);
    if (transceiver && transceiver.sender.track) {
      transceiver.sender.track.stop();
      return true;
    } else {
      return false;
    }
  };

  /**
   * Stops publishing all tracks and stop all tracks.
   */
  stopPublishing = () => {
    this.publisher.getSenders().forEach((s) => {
      if (s.track) {
        s.track.stop();
      }
      if (this.publisher.signalingState !== 'closed') {
        this.publisher.removeTrack(s);
      }
    });
    this.publisher.close();
  };

  updateVideoPublishQuality = async (enabledRids: string[]) => {
    console.log(
      'Updating publish quality, qualities requested by SFU:',
      enabledRids,
    );

    const videoSender = this.transceiverRegistry[TrackType.VIDEO]?.sender;

    if (!videoSender) return;

    const params = videoSender.getParameters();
    let changed = false;
    params.encodings.forEach((enc) => {
      console.log(enc.rid, enc.active);
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

  private onIceCandidate = async (e: RTCPeerConnectionIceEvent) => {
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }
    await this.rpcClient.iceTrickle({
      iceCandidate: getIceCandidate(candidate),
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
    });
  };

  private onNegotiationNeeded = async () => {
    console.log('AAA onNegotiationNeeded');
    const offer = await this.publisher.createOffer();
    if (this.isDtxEnabled && offer.sdp) {
      offer.sdp = offer.sdp.replace(
        'useinbandfec=1',
        'useinbandfec=1;usedtx=1',
      );
    }
    await this.publisher.setLocalDescription(offer);

    const trackInfos = this.publisher
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
            ? findOptimalVideoLayers(track)
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
        };
      });

    // TODO debounce for 250ms
    const response = await this.rpcClient.setPublisher({
      sdp: offer.sdp || '',
      tracks: trackInfos,
    });

    await this.publisher.setRemoteDescription({
      type: 'answer',
      sdp: response.response.sdp,
    });

    this.rpcClient.iceTrickleBuffer.publisherCandidates.subscribe(
      async (candidate) => {
        try {
          const iceCandidate = JSON.parse(candidate.iceCandidate);
          await this.publisher.addIceCandidate(iceCandidate);
        } catch (e) {
          console.error(`[Publisher] ICE candidate error`, e, candidate);
        }
      },
    );
  };

  private onIceCandidateError = (e: Event) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    console.error(`Publisher: ICE Candidate error`, errorMessage, e);
  };

  private onIceConnectionStateChange = (e: Event) => {
    console.log(
      `Publisher: ICE Connection state changed`,
      this.publisher.iceConnectionState,
      e,
    );
  };

  private onIceGatheringStateChange = (e: Event) => {
    console.log(
      `Publisher: ICE Gathering State`,
      this.publisher.iceGatheringState,
      e,
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
