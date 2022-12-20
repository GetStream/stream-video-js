import { MemberInput, StreamVideoClient } from '@stream-io/video-client';
import InCallManager from 'react-native-incall-manager';

const joinCall = async (
  videoClient: StreamVideoClient,
  callDetails: {
    autoJoin?: boolean;
    callId: string;
    callType: string;
    ring?: boolean;
    members: MemberInput[];
  },
) => {
  const { members, ring, callId, callType } = callDetails;
  let call;
  call = await videoClient.joinCall({
    id: callId,
    type: callType,
    // FIXME: OL this needs to come from somewhere // TODO: SANTHOSH, this is optional, check its purpose
    datacenterId: '',
    input: {
      ring: ring,
      members: members,
    },
  });
  if (!call) {
    throw new Error(`Failed to join a call with id: ${callId}`);
  }
  try {
    InCallManager.start({ media: 'video' });
    InCallManager.setForceSpeakerphoneOn(true);
    await call.join();
    return call;
  } catch (err) {
    console.warn('failed to join call', err);
  }
};

export { joinCall };
