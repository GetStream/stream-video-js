import { MemberInput, StreamVideoClient } from '@stream-io/video-client';
import InCallManager from 'react-native-incall-manager';
import { MediaStream } from 'react-native-webrtc';

const joinCall = async (
  videoClient: StreamVideoClient,
  id: string,
  type: string,
  localMediaStream: MediaStream,
  ring?: boolean,
  members?: MemberInput[],
) => {
  let call;
  if (members && ring) {
    call = await videoClient.joinCall({
      id,
      type,
      // FIXME: OL this needs to come from somewhere // TODO: SANTHOSH, this is optional, check its purpose
      datacenterId: '',
      input: {
        ring: ring,
        members: members,
      },
    });
  } else {
    call = await videoClient.joinCall({
      id,
      type,
      // FIXME: OL this needs to come from somewhere // TODO: SANTHOSH, this is optional, check its purpose
      datacenterId: '',
    });
  }
  if (!call) {
    throw new Error(`Failed to join a call with id: ${id}`);
  }
  try {
    InCallManager.start({ media: 'video' });
    InCallManager.setForceSpeakerphoneOn(true);
    await call.join(localMediaStream, localMediaStream);
    await call.publish(localMediaStream, localMediaStream);

    return call;
  } catch (err) {
    console.warn('failed to join call', err);
  }
};

const getOrCreateCall = async (
  videoClient: StreamVideoClient,
  localMediaStream: MediaStream,
  callDetails: {
    autoJoin?: boolean;
    callId: string;
    callType: string;
    ring?: boolean;
    members?: MemberInput[];
  },
) => {
  const { autoJoin, ring, members, callId, callType } = callDetails;
  let callMetadata;
  if (ring && members) {
    callMetadata = await videoClient.getOrCreateCall({
      id: callId,
      type: callType,
      input: {
        ring: true,
        members: members,
      },
    });
  } else {
    callMetadata = await videoClient.getOrCreateCall({
      id: callId,
      type: callType,
    });
  }
  if (callMetadata) {
    if (autoJoin) {
      const response = await joinCall(
        videoClient,
        callId,
        callType,
        localMediaStream,
        ring,
        members,
      );
      return { activeCall: callMetadata.call, call: response };
    } else {
      return { activeCall: callMetadata?.call, call: undefined };
    }
  }
};

export { getOrCreateCall, joinCall };
