import {
  ICEServer,
  JoinCallRequest,
  JoinCallResponse,
} from '../../gen/coordinator';
import { JoinCallData } from '../../types';
import { StreamClient } from '../../coordinator/connection/client';

/**
 * Collects all necessary information to join a call, talks to the coordinator
 * and returns the necessary information to join the call.
 *
 * @param httpClient the http client to use.
 * @param type the type of the call.
 * @param id the id of the call.
 * @param data the data for the call.
 */
export const join = async (
  httpClient: StreamClient,
  type: string,
  id: string,
  data?: JoinCallData,
) => {
  const joinCallResponse = await doJoin(httpClient, type, id, data);
  const { call, credentials, members, own_capabilities } = joinCallResponse;
  return {
    connectionConfig: toRtcConfiguration(credentials.ice_servers),
    sfuServer: credentials.server,
    token: credentials.token,
    metadata: call,
    members,
    ownCapabilities: own_capabilities,
  };
};

const doJoin = async (
  httpClient: StreamClient,
  type: string,
  id: string,
  data?: JoinCallData,
) => {
  const location = await httpClient.getLocationHint();
  const request: JoinCallRequest = {
    ...data,
    location,
  };
  return httpClient.post<JoinCallResponse, JoinCallRequest>(
    `/call/${type}/${id}/join`,
    request,
  );
};

const toRtcConfiguration = (config?: ICEServer[]) => {
  if (!config || config.length === 0) return undefined;
  const rtcConfig: RTCConfiguration = {
    iceServers: config.map((ice) => ({
      urls: ice.urls,
      username: ice.username,
      credential: ice.password,
    })),
  };
  return rtcConfig;
};
