import { StreamSfuClient } from '../StreamSfuClient';
import { RequestEvent } from '../gen/video/sfu/event/events';
import { PeerType } from '../gen/video/sfu/models/models';
import { Dispatcher } from './Dispatcher';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
  dispatcher: Dispatcher;
};

export const createPublisher = ({
  connectionConfig,
  rpcClient,
  dispatcher,
}: PublisherOpts) => {
  const publisher = new RTCPeerConnection(connectionConfig);
  publisher.addEventListener('icecandidate', (e) => {
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }

    rpcClient.send(
      RequestEvent.create({
        eventPayload: {
          oneofKind: 'iceTrickle',
          iceTrickle: {
            iceCandidate: JSON.stringify(candidate.toJSON()),
            peerType: PeerType.PUBLISHER_UNSPECIFIED,
          },
        },
      }),
    );
  });

  // will fire once media is attached to the peer connection
  publisher.addEventListener('negotiationneeded', async () => {
    console.log('AAA onNegotiationNeeded ');
    const offer = await publisher.createOffer();
    await publisher.setLocalDescription(offer);

    rpcClient.send(
      RequestEvent.create({
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
