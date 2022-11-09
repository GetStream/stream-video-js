import { useCallback, useEffect, useState } from 'react';
import {
  CallCreated,
  CallMeta,
  Credentials,
  Envelopes,
  StreamVideoClient,
  MemberInput,
} from '@stream-io/video-client';
import RNCallKeep from 'react-native-callkeep';

export type UseCallParams = {
  videoClient: StreamVideoClient | undefined;
  callId: string;
  callType: string;
  currentUser: string;
  autoJoin: boolean;
  ring?: boolean;
  members?: MemberInput[];
  displayIncomingCallNow?: () => void;
};

export const useCall = ({
  videoClient,
  callId,
  callType,
  currentUser,
  displayIncomingCallNow,
  autoJoin,
  members,
  ring,
}: UseCallParams) => {
  const [activeCall, setActiveCall] = useState<CallMeta.Call>();
  const [credentials, setCredentials] = useState<Credentials>();

  const joinCall = useCallback(
    async (id: string, type: string) => {
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
        if (response.call && response.call.call && response.edges) {
          setActiveCall(response.call.call);
          setCredentials(edge?.credentials);
        }
      }
    },
    [videoClient, members, ring],
  );

  const getOrCreateCall = useCallback(async () => {
    if (!videoClient) {
      return;
    }
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
        joinCall(callId, callType);
      } else {
        setActiveCall(callMetadata.call);
      }
    }
  }, [autoJoin, callId, callType, joinCall, videoClient, members, ring]);

  useEffect(() => {
    const onCallCreated = (event: CallCreated, _envelopes?: Envelopes) => {
      const { call } = event;
      if (!call) {
        console.warn("Can't find call in CallCreated event");
        return;
      }
      RNCallKeep.displayIncomingCall(
        call.callCid.split(':')[1],
        '2738282929',
        call.createdByUserId,
        'generic',
        true,
      );
      // initiator, immediately joins the call
      if (call.createdByUserId === currentUser) {
        joinCall(call.id, call.type).then(() => {
          console.log(`Joining call with id:${call.id}`);
        });
      }
    };
    return videoClient?.on('callCreated', onCallCreated);
  }, [currentUser, joinCall, videoClient, displayIncomingCallNow]);

  // useEffect(() => {
  //   return client?.on(
  //     'callStarted',
  //     (event: CallStarted, envelopes?: Envelopes) => {
  //       const startedCall = envelopes?.calls[event.callCid];
  //       if (
  //         startedCall &&
  //         startedCall.id === callId &&
  //         startedCall.type === callType
  //       ) {
  //         setActiveCall(startedCall);
  //         if (autoJoin) {
  //           joinCall(startedCall.id, startedCall.type).catch((e) => {
  //             console.error(`Failed to join call`, startedCall, e);
  //           });
  //         }
  //       }
  //     },
  //   );
  // }, [callId, client, callType, autoJoin, joinCall]);

  return { activeCall, credentials, getOrCreateCall };
};
