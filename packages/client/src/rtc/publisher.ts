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

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
};

export const createPublisher = ({
  connectionConfig,
  rpcClient,
}: PublisherOpts) => {
  const publisher = new RTCPeerConnection(connectionConfig);
  const transceiverMapping: {
    [key in TrackType]: RTCRtpTransceiver | undefined;
  } = {
    [TrackType.AUDIO]: undefined,
    [TrackType.VIDEO]: undefined,
    [TrackType.SCREEN_SHARE]: undefined,
    [TrackType.SCREEN_SHARE_AUDIO]: undefined,
    [TrackType.UNSPECIFIED]: undefined,
  };
  publisher.addEventListener('icecandidate', async (e) => {
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }
    await rpcClient.iceTrickle({
      iceCandidate: getIceCandidate(candidate),
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
    });
  });
  publisher.addEventListener('icecandidateerror', (e) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    console.error(`Publisher: ICE Candidate error`, errorMessage, e);
  });
  publisher.addEventListener('iceconnectionstatechange', (e) => {
    console.log(
      `Publisher: ICE Connection state changed`,
      publisher.iceConnectionState,
      e,
    );
  });
  publisher.addEventListener('icegatheringstatechange', (e) => {
    console.log(
      `Publisher: ICE Gathering State`,
      publisher.iceGatheringState,
      e,
    );
  });

  const { iceTrickleBuffer } = rpcClient;
  // will fire once media is attached to the peer connection
  publisher.addEventListener('negotiationneeded', async () => {
    console.log('AAA onNegotiationNeeded');
    const offer = await publisher.createOffer();
    await publisher.setLocalDescription(offer);

    const trackInfos = publisher
      .getTransceivers()
      .filter((t) => t.direction === 'sendonly' && !!t.sender.track)
      .map<TrackInfo>((transceiver) => {
        const trackType = Number(
          Object.keys(transceiverMapping).find(
            (key) =>
              transceiverMapping[key as any as TrackType] === transceiver,
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
          quality: ridToVideoQuality(optimalLayer.rid || ''),
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
    const response = await rpcClient.setPublisher({
      sdp: offer.sdp || '',
      tracks: trackInfos,
    });

    await publisher.setRemoteDescription({
      type: 'answer',
      sdp: response.response.sdp,
    });

    iceTrickleBuffer.publisherCandidates.subscribe(async (candidate) => {
      try {
        const iceCandidate = JSON.parse(candidate.iceCandidate);
        await publisher.addIceCandidate(iceCandidate);
      } catch (e) {
        console.error(`[Publisher] ICE candidate error`, e, candidate);
      }
    });
  });

  return { publisher, transceiverMapping };
};

const ridToVideoQuality = (rid: string): VideoQuality => {
  return rid === 'q'
    ? VideoQuality.LOW_UNSPECIFIED
    : rid === 'h'
    ? VideoQuality.MID
    : rid === 'f'
    ? VideoQuality.HIGH
    : VideoQuality.HIGH; // default to HIGH
};
