import { StreamSfuClient } from '../StreamSfuClient';
import { Dispatcher } from './Dispatcher';
import { PeerType } from '../gen/video/sfu/models/models';

export type SubscriberOpts = {
  rpcClient: StreamSfuClient;
  dispatcher: Dispatcher;
  connectionConfig?: RTCConfiguration;
  onTrack?: (e: RTCTrackEvent) => void;
};

export const createSubscriber = ({
  rpcClient,
  dispatcher,
  connectionConfig,
  onTrack,
}: SubscriberOpts) => {
  const subscriber = new RTCPeerConnection(connectionConfig);
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
      sdpMlineIndex: candidate.sdpMLineIndex ?? undefined,
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
