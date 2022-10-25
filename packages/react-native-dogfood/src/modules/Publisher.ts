import { RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import { PeerType } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { StreamSfuClient } from '@stream-io/video-client';
import { RTCConfiguration } from '../../types';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
  candidates: any[];
};

export const createPublisher = ({
  connectionConfig,
  rpcClient,
  candidates,
}: PublisherOpts) => {
  const publisher = new RTCPeerConnection(connectionConfig);
  publisher.addEventListener('icecandidate', async (e) => {
    // @ts-ignore
    const { candidate } = e;
    if (!candidate) {
      console.log('null ice candidate');
      return;
    }

    const splittedCandidate = candidate.candidate.split(' ');
    const ufragIndex =
      splittedCandidate.findIndex((s: string) => s === 'ufrag') + 1;
    const usernameFragment = splittedCandidate[ufragIndex];
    console.log('********/n splittedCandidate', splittedCandidate);
    console.log('********/n usernameFragment', usernameFragment);
    await rpcClient.rpc.iceTrickle({
      sessionId: rpcClient.sessionId,
      iceCandidate: JSON.stringify({ ...candidate, usernameFragment }),
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
    });
  });

  // will fire once media is attached to the peer connection
  publisher.addEventListener('negotiationneeded', async () => {
    console.log('AAA onNegotiationNeeded ');
    const offer = (await publisher.createOffer({})) as RTCSessionDescription;
    await publisher.setLocalDescription(offer);

    const response = await rpcClient.rpc.setPublisher({
      sdp: offer.sdp || '',
      sessionId: rpcClient.sessionId,
    });

    await publisher.setRemoteDescription({
      type: 'answer',
      sdp: response.response.sdp,
    });

    // ICE candidates have to be added after remoteDescription is set
    for (const candidate of candidates) {
      await publisher.addIceCandidate(candidate);
    }
    candidates = []; // FIXME: clean the call object accordingly
  });

  return publisher;
};
