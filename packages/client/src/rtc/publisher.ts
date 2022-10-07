import { StreamSfuRpcClient } from '../StreamSfuRpcClient';

export type PublisherOpts = {
  rpcClient: StreamSfuRpcClient;
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
    await rpcClient.rpc.sendIceCandidate({
      publisher: true,
      sessionId: rpcClient.sessionId,
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid ?? undefined,
      sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
      usernameFragment: candidate.usernameFragment ?? undefined,
    });
  });

  // will fire once media is attached to the peer connection
  publisher.addEventListener('negotiationneeded', async () => {
    console.log('AAA onNegotiationNeeded ');
    const offer = await publisher.createOffer();
    await publisher.setLocalDescription(offer);

    const { response: sfu } = await rpcClient.rpc.setPublisher({
      sessionId: rpcClient.sessionId,
      sdp: offer.sdp || '',
    });

    await publisher.setRemoteDescription({
      type: 'answer',
      sdp: sfu.sdp,
    });
  });

  return publisher;
};
