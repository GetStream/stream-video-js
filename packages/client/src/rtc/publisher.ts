import { StreamSfuClient } from '../StreamSfuClient';
import { ICETrickle, PeerType } from '../gen/video/sfu/models/models';
import { ReplaySubject } from 'rxjs';
import { getIceCandidate } from './helpers/iceCandidate';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
  candidates: ReplaySubject<ICETrickle>;
};

export const createPublisher = ({
  connectionConfig,
  rpcClient,
  candidates,
}: PublisherOpts) => {
  const publisher = new RTCPeerConnection(connectionConfig);
  publisher.addEventListener('icecandidate', async (e) => {
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }
    await rpcClient.rpc.iceTrickle({
      sessionId: rpcClient.sessionId,
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

  // will fire once media is attached to the peer connection
  publisher.addEventListener('negotiationneeded', async () => {
    console.log('AAA onNegotiationNeeded ');
    const offer = await publisher.createOffer();
    await publisher.setLocalDescription(offer);

    const response = await rpcClient.rpc.setPublisher({
      sdp: offer.sdp || '',
      sessionId: rpcClient.sessionId,
    });

    await publisher.setRemoteDescription({
      type: 'answer',
      sdp: response.response.sdp,
    });

    candidates.subscribe((candidate) => {
      try {
        const iceCandidate = JSON.parse(candidate.iceCandidate);
        publisher.addIceCandidate(iceCandidate);
      } catch (e) {
        console.error(`An error occurred while adding ICE candidate`, e);
      }
    });
  });

  return publisher;
};
