import { Client } from '../rpc/Client';
import { Dispatcher } from './Dispatcher';
import { PeerType } from '../gen/sfu_models/models';

export type SubscriberOpts = {
  sfuUrl: string;
  rpcClient: Client;
  dispatcher: Dispatcher;
  onTrack?: (e: RTCTrackEvent) => void;
};

export const createSubscriber = ({
  sfuUrl,
  rpcClient,
  dispatcher,
  onTrack,
}: SubscriberOpts) => {
  const subscriber = new RTCPeerConnection({
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

  subscriber.addEventListener('icecandidate', async (e) => {
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }
    await rpcClient.rpc.sendIceCandidate({
      sessionId: rpcClient.sessionId,
      publisher: false,
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid ?? undefined,
      sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
      usernameFragment: candidate.usernameFragment ?? undefined,
    });
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
    await rpcClient.rpc.sendAnswer({
      sessionId: rpcClient.sessionId,
      peerType: PeerType.SUBSCRIBER,
      sdp: answer.sdp || '',
    });
  });

  return subscriber;
};
