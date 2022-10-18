import { StreamSfuClient } from '../StreamSfuClient';
import { PeerType } from '../gen/video/sfu/models/models';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
  candidates: RTCIceCandidateInit[];
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
      iceCandidate: JSON.stringify(candidate.toJSON()),
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
    });
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

    // ICE candidates have to be added after remoteDescription is set
    for (const candidate of candidates) {
      await publisher.addIceCandidate(candidate);
    }
    candidates = []; // FIXME: clean the call object accordingly
  });

  return publisher;
};
