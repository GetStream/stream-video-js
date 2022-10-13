import { StreamSfuClient } from '../StreamSfuClient';
import { RequestEvent } from '../gen/video/sfu/event/events';
import { PeerType } from '../gen/video/sfu/models/models';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
  signal: WebSocket;
};

export const createPublisher = ({
  connectionConfig,
  rpcClient,
  signal,
}: PublisherOpts) => {
  const publisher = new RTCPeerConnection(connectionConfig);
  publisher.addEventListener('icecandidate', (e) => {
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }

    signal.send(
      RequestEvent.toJsonString({
        eventPayload: {
          oneofKind: 'iceTrickle',
          iceTrickle: {
            iceCandidate: candidate.candidate,
            peerType: PeerType.PUBLISHER,
          },
        },
      }),
    );

    // await rpcClient.rpc.sendIceCandidate({
    //   publisher: true,
    //   sessionId: rpcClient.sessionId,
    //   candidate: candidate.candidate,
    //   sdpMid: candidate.sdpMid ?? undefined,
    //   sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
    //   usernameFragment: candidate.usernameFragment ?? undefined,
    // });
  });

  // will fire once media is attached to the peer connection
  publisher.addEventListener('negotiationneeded', async () => {
    console.log('AAA onNegotiationNeeded ');
    const offer = await publisher.createOffer();
    await publisher.setLocalDescription(offer);

    signal.send(
      RequestEvent.toJsonString({
        eventPayload: {
          oneofKind: 'publish',
          publish: {
            sdp: offer.sdp || '',
            sessionId: rpcClient.sessionId,
            ase: 'asd',
          },
        },
      }),
    );

    const { response: sfu } = await rpcClient.rpc.setPublisher({
      sessionId: rpcClient.sessionId,
      sdp: offer.sdp || '',
    });

    // TODO listen for an event
    await publisher.setRemoteDescription({
      type: 'answer',
      sdp: sfu.sdp,
    });
  });

  return publisher;
};
