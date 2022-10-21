import { StreamSfuClient } from '../StreamSfuClient';
import { Dispatcher } from './Dispatcher';
import { PeerType } from '../gen/video/sfu/models/models';

export type SubscriberOpts = {
  rpcClient: StreamSfuClient;
  dispatcher: Dispatcher;
  connectionConfig?: RTCConfiguration;
  onTrack?: (e: RTCTrackEvent) => void;
  candidates: RTCIceCandidateInit[];
};

export const createSubscriber = ({
  rpcClient,
  dispatcher,
  connectionConfig,
  onTrack,
  candidates,
}: SubscriberOpts) => {
  const subscriber = new RTCPeerConnection(connectionConfig);
  subscriber.addEventListener('icecandidate', async (e) => {
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }

    await rpcClient.rpc.iceTrickle({
      sessionId: rpcClient.sessionId,
      iceCandidate: JSON.stringify(candidate.toJSON()),
      peerType: PeerType.SUBSCRIBER,
    });
  });
  subscriber.addEventListener('icecandidateerror', (e) => {
    console.error(`Subscriber: ICE Candidate error`, e);
  });
  subscriber.addEventListener('iceconnectionstatechange', (e) => {
    console.log(`Subscriber: ICE Connection state changed`, e);
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

    // ICE candidates have to be added after remoteDescription is set
    for (const candidate of candidates) {
      await subscriber.addIceCandidate(candidate);
    }
    candidates = []; // FIXME: clean the call object accordingly

    // apply ice candidates
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
