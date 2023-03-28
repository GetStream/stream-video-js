import {
  DatacenterResponse,
  GetCallEdgeServerRequest,
  ICEServer,
  JoinCallRequest,
} from '../../gen/coordinator';
import { measureResourceLoadLatencyTo } from './latency';
import { StreamCoordinatorClient } from '../../coordinator/StreamCoordinatorClient';

export const join = async (
  httpClient: StreamCoordinatorClient,
  type: string,
  id: string,
  data?: JoinCallRequest,
) => {
  const joinCallResponse = await httpClient.call(type, id).join(data);
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
  httpClient: StreamCoordinatorClient,
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

  return httpClient.getCallEdgeServer(id, type, {
    latency_measurements: latencyByEdge,
  });
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
