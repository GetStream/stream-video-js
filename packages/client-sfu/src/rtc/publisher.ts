import { Client } from '../rpc/Client';

export type PublisherOpts = {
  sfuUrl: string;
  rpcClient: Client;
};

export const createPublisher = ({ sfuUrl, rpcClient }: PublisherOpts) => {
  const publisher = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
      {
        urls: `turn:${sfuUrl}:3478`,
        username: 'video',
        credential: 'video',
      },
    ],
  });

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
