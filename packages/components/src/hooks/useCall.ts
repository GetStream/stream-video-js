import { useStreamVideoClient } from '../StreamVideo';
import { useCallback, useEffect, useState } from 'react';
import {
  Call,
  CallCreated,
  CallStarted,
  Credentials,
  Envelopes,
} from '@stream-io/video-client';

export type UseCallParams = {
  callId: string;
  callType: string;
  currentUser: string;
  autoJoin: boolean;
};

export const useCall = ({
  callId,
  callType,
  currentUser,
  autoJoin,
}: UseCallParams) => {
  const client = useStreamVideoClient();
  const [activeCall, setActiveCall] = useState<Call>();
  const [credentials, setCredentials] = useState<Credentials>();

  const joinCall = useCallback(
    async (id: string, type: string) => {
      if (!client) return;
      const { call: callEnvelope, edges } = await client.joinCall({
        id,
        type,
        // FIXME: OL this needs to come from somewhere
        datacenterId: 'amsterdam',
      });

      if (callEnvelope && callEnvelope.call && edges) {
        const edge = await client.getCallEdgeServer(callEnvelope.call, edges);
        setActiveCall(callEnvelope.call);
        setCredentials(edge.credentials);
      }
    },
    [client],
  );

  useEffect(() => {
    if (!client) return;
    const getOrCreateCall = async () => {
      const { call: callMetadata } = await client.getOrCreateCall({
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
    };

    getOrCreateCall().catch((e) => {
      console.error(`Failed to getOrCreateCall`, callId, callType, e);
    });
  }, [callId, client, callType, autoJoin, joinCall]);

  useEffect(() => {
    const onCallCreated = (event: CallCreated, envelopes?: Envelopes) => {
      const { callCid } = event;
      const call = envelopes?.calls[callCid];
      if (!call) {
        console.warn(`Can't find call with id: ${callCid}`);
        return;
      }

      console.log(`Call created`, event, call);
      // initiator, immediately joins the call
      if (call.createdByUserId === currentUser) {
        joinCall(call.id, call.type).then(() => {
          console.log(`Joining call with id:${call.id}`);
        });
      }
    };
    return client?.on('callCreated', onCallCreated);
  }, [client, currentUser, joinCall]);

  useEffect(() => {
    return client?.on(
      'callStarted',
      (event: CallStarted, envelopes?: Envelopes) => {
        const startedCall = envelopes?.calls[event.callCid];
        if (
          startedCall &&
          startedCall.id === callId &&
          startedCall.type === callType
        ) {
          setActiveCall(startedCall);
          if (autoJoin) {
            joinCall(startedCall.id, startedCall.type).catch((e) => {
              console.error(`Failed to join call`, startedCall, e);
            });
          }
        }
      },
    );
  }, [callId, client, callType, autoJoin, joinCall]);

  return { activeCall, credentials };
};
