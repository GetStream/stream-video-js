import { MemberInput, StreamVideoClient } from '@stream-io/video-client';

const joinCall = async (
  videoClient: StreamVideoClient,
  id: string,
  type: string,
  ring?: boolean,
  members?: MemberInput[],
) => {
  if (!videoClient) {
    return;
  }
  let result;
  if (members && ring) {
    result = await videoClient.joinCallRaw({
      id,
      type,
      // FIXME: OL this needs to come from somewhere // TODO: SANTHOSH, this is optional, check its purpose
      datacenterId: 'amsterdam',
      input: {
        ring: ring,
        members: members,
      },
    });
  } else {
    result = await videoClient.joinCallRaw({
      id,
      type,
      // FIXME: OL this needs to come from somewhere // TODO: SANTHOSH, this is optional, check its purpose
      datacenterId: 'amsterdam',
    });
  }
  if (result) {
    const { response, edge } = result;
    return { activeCall: response.call?.call, credentials: edge.credentials };
  }
};

const getOrCreateCall = async (
  videoClient: StreamVideoClient,
  callDetails: {
    autoJoin?: boolean;
    callId: string;
    callType: string;
    ring?: boolean;
    members?: MemberInput[];
  },
) => {
  if (!videoClient) {
    return;
  }
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
        ring,
        members,
      );
      return response;
    } else {
      return { activeCall: callMetadata?.call, credentials: undefined };
    }
  }
};

export { getOrCreateCall, joinCall };
