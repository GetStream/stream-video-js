import { RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import { PeerType } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { StreamSfuClient } from '@stream-io/video-client';
import { RTCConfiguration } from '../../types';

export type PublisherOpts = {
  rpcClient: StreamSfuClient;
  connectionConfig?: RTCConfiguration;
  getCandidates: () => any[];
  clearCandidates: () => void;
};

export const createPublisher = ({
  connectionConfig,
  rpcClient,
  getCandidates,
  clearCandidates,
}: PublisherOpts) => {
  const publisher = new RTCPeerConnection(connectionConfig);
  publisher.addEventListener('icecandidate', async (e) => {
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
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
    });
  });

  // will fire once media is attached to the peer connection
  publisher.addEventListener('negotiationneeded', async () => {
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

    const candidates = getCandidates();
    // ICE candidates have to be added after remoteDescription is set
    for (const candidate of candidates) {
      await publisher.addIceCandidate(candidate);
    }
    clearCandidates();
  });

  return publisher;
};
