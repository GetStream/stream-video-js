import { StreamSfuClient } from '../StreamSfuClient';
import { RequestEvent } from '../gen/video/sfu/event/events';
import { PeerType } from '../gen/video/sfu/models/models';
import { Dispatcher } from './Dispatcher';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
  dispatcher: Dispatcher;
  signal: WebSocket;
};

export const createPublisher = ({
  connectionConfig,
  rpcClient,
  dispatcher,
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
      RequestEvent.toBinary({
        eventPayload: {
          oneofKind: 'iceTrickle',
          iceTrickle: {
            iceCandidate: candidate.candidate,
            peerType: PeerType.PUBLISHER_UNSPECIFIED,
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
      RequestEvent.toBinary({
        eventPayload: {
          oneofKind: 'publish',
          publish: {
            sdp: offer.sdp || '',
            sessionId: rpcClient.sessionId,
            token: rpcClient.token,
          },
        },
      }),
    );

    // const { response: sfu } = await rpcClient.rpc.setPublisher({
    //   sessionId: rpcClient.sessionId,
    //   sdp: offer.sdp || '',
    // });
    //
    // // TODO listen for an event
    // await publisher.setRemoteDescription({
    //   type: 'answer',
    //   sdp: sfu.sdp,
    // });
  });

  dispatcher.on('publisherAnswer', async (message) => {
    if (message.eventPayload.oneofKind !== 'publisherAnswer') return;
    const { publisherAnswer } = message.eventPayload;

    await publisher.setRemoteDescription({
      type: 'answer',
      sdp: publisherAnswer.sdp,
    });
  });

  return publisher;
};
