import { StreamSfuClient } from '../StreamSfuClient';
import { Dispatcher } from './Dispatcher';
import { PeerType } from '../gen/video/sfu/models/models';
import { RequestEvent } from '../gen/video/sfu/event/events';

export type SubscriberOpts = {
  rpcClient: StreamSfuClient;
  dispatcher: Dispatcher;
  connectionConfig?: RTCConfiguration;
  onTrack?: (e: RTCTrackEvent) => void;
  signal: WebSocket;
};

export const createSubscriber = ({
  rpcClient,
  dispatcher,
  connectionConfig,
  onTrack,
  signal,
}: SubscriberOpts) => {
  const subscriber = new RTCPeerConnection(connectionConfig);
  subscriber.addEventListener('icecandidate', (e) => {
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
            iceCandidate: JSON.stringify(candidate.toJSON()),
            peerType: PeerType.SUBSCRIBER,
          },
        },
      }),
    );

    // await rpcClient.rpc.sendIceCandidate({
    //   sessionId: rpcClient.sessionId,
    //   publisher: false,
    //   candidate: candidate.candidate,
    //   sdpMid: candidate.sdpMid ?? undefined,
    //   sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
    //   usernameFragment: candidate.usernameFragment ?? undefined,
    // });
  });

  if (onTrack) {
    subscriber.addEventListener('track', onTrack);
  }

  dispatcher.on('subscriberOffer', async (message) => {
    if (message.eventPayload.oneofKind !== 'subscriberOffer') return;
    const { subscriberOffer } = message.eventPayload;
    console.log(`Received subscriberOffer`, subscriberOffer);

    await subscriber.setRemoteDescription({
      type: 'offer',
      sdp: subscriberOffer.sdp,
    });

    const answer = await subscriber.createAnswer();
    await subscriber.setLocalDescription(answer);

    signal.send(
      RequestEvent.toBinary({
        eventPayload: {
          oneofKind: 'answer',
          answer: {
            sessionId: rpcClient.sessionId,
            token: rpcClient.token,
            peerType: PeerType.SUBSCRIBER,
            sdp: answer.sdp || '',
          },
        },
      }),
    );
    // await rpcClient.rpc.sendAnswer({
    //   sessionId: rpcClient.sessionId,
    //   peerType: PeerType.SUBSCRIBER,
    //   sdp: answer.sdp || '',
    // });
  });

  return subscriber;
};
