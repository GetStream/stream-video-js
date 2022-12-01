import { StreamSfuClient } from '../StreamSfuClient';
import {
  PeerType,
  TrackInfo,
  VideoLayer,
} from '../gen/video/sfu/models/models';
import { getIceCandidate } from './helpers/iceCandidate';
import { findOptimalVideoLayers } from './videoLayers';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
};

export const createPublisher = ({
  connectionConfig,
  rpcClient,
}: PublisherOpts) => {
  const publisher = new RTCPeerConnection(connectionConfig);
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
        const track = transceiver.sender.track!;
        const layers = findOptimalVideoLayers(track).map<VideoLayer>(
          (optimalLayer) => ({
            rid: optimalLayer.rid || '',
            bitrate: optimalLayer.maxBitrate || 0,
            fps: optimalLayer.maxFramerate || 0,
            videoDimension: {
              width: optimalLayer.width,
              height: optimalLayer.height,
            },
          }),
        );

        return {
          trackId: track.id,
          layers: layers,
          // @ts-ignore FIXME: OL: this is a hack
          trackType: transceiver.__trackType,
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

  return publisher;
};
