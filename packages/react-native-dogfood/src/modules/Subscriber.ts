import { RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import { PeerType } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { StreamSfuClient } from '@stream-io/video-client';
import { RTCConfiguration } from '../../types';
import { Dispatcher } from '@stream-io/video-client/src/rtc/Dispatcher';

export type SubscriberOpts = {
  rpcClient: StreamSfuClient;
  dispatcher: Dispatcher;
  connectionConfig?: RTCConfiguration;
  onTrack?: (e: any) => void;
  getCandidates: () => any[];
  clearCandidates: () => void;
};

export const createSubscriber = ({
  rpcClient,
  dispatcher,
  connectionConfig,
  onTrack,
  getCandidates,
  clearCandidates,
}: SubscriberOpts) => {
  const subscriber = new RTCPeerConnection(connectionConfig);
  subscriber.addEventListener('icecandidate', async (e) => {
    // @ts-ignore
    const { candidate } = e;
    if (!candidate) {
      return;
    }

    const splittedCandidate = candidate.candidate.split(' ');
    const ufragIndex =
      splittedCandidate.findIndex((s: string) => s === 'ufrag') + 1;
    const usernameFragment = splittedCandidate[ufragIndex];
    await rpcClient.rpc.iceTrickle({
      sessionId: rpcClient.sessionId,
      iceCandidate: JSON.stringify({ ...candidate, usernameFragment }),
      peerType: PeerType.SUBSCRIBER,
    });
  });

  if (onTrack) {
    subscriber.addEventListener('track', onTrack);
  }

  dispatcher.on('subscriberOffer', async (message) => {
    if (message.eventPayload.oneofKind !== 'subscriberOffer') return;
    const { subscriberOffer } = message.eventPayload;

    await subscriber.setRemoteDescription({
      type: 'offer',
      sdp: subscriberOffer.sdp,
    });
    const candidates = getCandidates();

    // ICE candidates have to be added after remoteDescription is set
    for (const candidate of candidates) {
      await subscriber.addIceCandidate(candidate);
    }
    clearCandidates();

    // apply ice candidates
    const answer = (await subscriber.createAnswer()) as RTCSessionDescription;
    await subscriber.setLocalDescription(answer);

    await rpcClient.rpc.sendAnswer({
      sessionId: rpcClient.sessionId,
      peerType: PeerType.SUBSCRIBER,
      sdp: answer.sdp || '',
    });
  });

  return subscriber;
};
