import { useCallback, useEffect, useState } from 'react';
// import * as CallMeta from '../gen/video/coordinator/call_v1/call'; // due to name collision with `/rtc/Call.ts`
import {
  Call,
  CallCreated,
  Credentials,
  Envelopes,
  StreamVideoClient,
} from '@stream-io/video-client';

export type UseCallParams = {
  videoClient: StreamVideoClient | undefined;
  callId: string;
  callType: string;
  currentUser: string;
  autoJoin: boolean;
};

export const useCall = ({
  videoClient,
  callId,
  callType,
  currentUser,
  autoJoin,
}: UseCallParams) => {
  const [activeCall, setActiveCall] = useState<CallMeta.Call>();
  const [credentials, setCredentials] = useState<Credentials>();

  const joinCall = useCallback(
    async (id: string, type: string) => {
      if (!videoClient) {
        return;
      }
      const { call: callEnvelope, edges } = await videoClient.joinCall({
        id,
        type,
        // FIXME: OL this needs to come from somewhere // TODO: SANTHOSH, this is optional, check its purpose
        datacenterId: 'amsterdam',
      });

      if (callEnvelope && callEnvelope.call && edges) {
        const edge = await videoClient.getCallEdgeServer(
          callEnvelope.call,
          edges,
        );
        setActiveCall(callEnvelope.call);
        setCredentials(edge.credentials);
      }
    },
    [videoClient],
  );

  const getOrCreateCall = useCallback(async () => {
    if (!videoClient) {
      return;
    }
    const { call: callMetadata } = await videoClient.getOrCreateCall({
      id: callId,
      type: callType,
    });
    if (callMetadata) {
      if (autoJoin) {
        joinCall(callId, callType);
      } else {
        setActiveCall(callMetadata.call);
      }
    }
  }, [autoJoin, callId, callType, joinCall, videoClient]);

  useEffect(() => {
    const onCallCreated = (event: CallCreated, _envelopes?: Envelopes) => {
      const { call } = event;
      if (!call) {
        console.warn("Can't find call in CallCreated event");
        return;
      }

      console.log('Call created', event, call);
      // initiator, immediately joins the call
      if (call.createdByUserId === currentUser) {
        joinCall(call.id, call.type).then(() => {
          console.log(`Joining call with id:${call.id}`);
        });
      }
    };
    return videoClient?.on('callCreated', onCallCreated);
  }, [currentUser, joinCall, videoClient]);

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
