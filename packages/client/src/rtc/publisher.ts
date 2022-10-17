import { StreamSfuClient } from '../StreamSfuClient';
import { SfuEvent } from '../gen/video/sfu/event/events';
import { PeerType } from '../gen/video/sfu/models/models';
import { Dispatcher } from './Dispatcher';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
  dispatcher: Dispatcher;
  signal: WebSocket;
  candidates: RTCIceCandidateInit[];
};

export const createPublisher = ({
  connectionConfig,
  rpcClient,
  dispatcher,
  signal,
  candidates,
}: PublisherOpts) => {
  const publisher = new RTCPeerConnection(connectionConfig);
  publisher.addEventListener('icecandidate', async (e) => {
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }
      await rpcClient.rpc.iceTrickle(
      {
        sessionId: rpcClient.sessionId,
        iceCandidate: JSON.stringify(candidate.toJSON()),
        peerType: PeerType.PUBLISHER_UNSPECIFIED,
      },
    );
  });

  // will fire once media is attached to the peer connection
  publisher.addEventListener('negotiationneeded', async () => {
    console.log('AAA onNegotiationNeeded ');
    const offer = await publisher.createOffer();
    await publisher.setLocalDescription(offer);

   const response=await rpcClient.rpc.setPublisher({
            sdp: offer.sdp || '',
            sessionId: rpcClient.sessionId,
          });

    await publisher.setRemoteDescription({
      type: 'answer',
      sdp: response.response.sdp,
    });

    await candidates.forEach( (candidate) => {
      publisher.addIceCandidate(candidate)
    })
    candidates = [];
  });


  return publisher;
};
