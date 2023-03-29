import {
  DatacenterResponse,
  GetCallEdgeServerRequest,
  GetCallEdgeServerResponse,
  ICEServer,
  JoinCallRequest,
  JoinCallResponse,
} from '../../gen/coordinator';
import { measureResourceLoadLatencyTo } from './latency';
import { StreamClient } from '../../coordinator/connection/client';

export const join = async (
  httpClient: StreamClient,
  type: string,
  id: string,
  data?: JoinCallRequest,
) => {
  await httpClient.connectionIdPromise;
  let joinCallResponse: JoinCallResponse;
  try {
    joinCallResponse = await httpClient.post<JoinCallResponse>(
      `/call/${type}/${id}/join`,
      data,
    );
  } catch (e) {
    // fallback scenario, until we get a new Coordinator deployed
    joinCallResponse = await httpClient.post<JoinCallResponse>(
      `/join_call/${type}/${id}`,
      data,
    );
  }
  const { call, edges, members } = joinCallResponse;

  const { credentials } = await getCallEdgeServer(httpClient, type, id, edges);
  return {
    connectionConfig: toRtcConfiguration(credentials.ice_servers),
    sfuServer: credentials.server,
    token: credentials.token,
    metadata: call,
    members,
  };
};

const getCallEdgeServer = async (
  httpClient: StreamClient,
  type: string,
  id: string,
  edges: DatacenterResponse[],
) => {
  const latencyByEdge: GetCallEdgeServerRequest['latency_measurements'] = {};
  await Promise.all(
    edges.map(async (edge) => {
      latencyByEdge[edge.name] = await measureResourceLoadLatencyTo(
        edge.latency_url,
      );
    }),
  );

  return httpClient.post<GetCallEdgeServerResponse>(
    `/call/${type}/${id}/get_edge_server`,
    {
      latency_measurements: latencyByEdge,
    },
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
