import { StreamSfuClient } from '../StreamSfuClient';
import { Dispatcher } from './Dispatcher';
import { getIceCandidate } from './helpers/iceCandidate';
import { ICETrickle, PeerType } from '../gen/video/sfu/models/models';
import { ReplaySubject } from 'rxjs';

export type SubscriberOpts = {
  rpcClient: StreamSfuClient;
  dispatcher: Dispatcher;
  connectionConfig?: RTCConfiguration;
  onTrack?: (e: RTCTrackEvent) => void;
  candidates: ReplaySubject<ICETrickle>;
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
      iceCandidate: getIceCandidate(candidate),
      peerType: PeerType.SUBSCRIBER,
    });
  });
  subscriber.addEventListener('icecandidateerror', (e) => {
    const errorMessage =
      e instanceof RTCPeerConnectionIceErrorEvent &&
      `${e.errorCode}: ${e.errorText}`;
    console.error(`Subscriber: ICE Candidate error`, errorMessage, e);
  });
  subscriber.addEventListener('iceconnectionstatechange', (e) => {
    console.log(
      `Subscriber: ICE Connection state changed`,
      subscriber.iceConnectionState,
      e,
    );
  });
  subscriber.addEventListener('icegatheringstatechange', (e) => {
    console.log(
      `Subscriber: ICE Gathering State`,
      subscriber.iceGatheringState,
      e,
    );
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

    candidates.subscribe((candidate) => {
      try {
        const iceCandidate = JSON.parse(candidate.iceCandidate);
        subscriber.addIceCandidate(iceCandidate);
      } catch (e) {
        console.error(`An error occurred while adding ICE candidate`, e);
      }
    });

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
