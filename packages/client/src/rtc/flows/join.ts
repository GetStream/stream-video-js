import {
  DatacenterResponse,
  GetCallEdgeServerRequest,
  GetCallEdgeServerResponse,
  ICEServer,
  JoinCallRequest,
  JoinCallResponse,
} from '../../gen/coordinator';
import { measureLatencyToEdges } from './latency';
import { StreamClient } from '../../coordinator/connection/client';

const getCascadingModeParams = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location?.search);
  const cascadingEnabled = params.get('cascading') !== null;
  if (cascadingEnabled) {
    const rawParams: Record<string, string> = {};
    params.forEach((value, key) => {
      rawParams[key] = value;
    });
    return rawParams;
  }
  return null;
};

export const watch = async (
  httpClient: StreamClient,
  type: string,
  id: string,
  data?: JoinCallRequest,
) => {
  await httpClient.connectionIdPromise;
  // FIXME OL: remove this once cascading is enabled by default
  const cascadingModeParams = getCascadingModeParams();
  if (cascadingModeParams) {
    return httpClient.doAxiosRequest<JoinCallResponse>(
      'post',
      `/call/${type}/${id}/join`,
      data,
      {
        params: {
          ...cascadingModeParams,
        },
      },
    );
  }
  return httpClient.post<JoinCallResponse, JoinCallRequest>(
    `/call/${type}/${id}/join`,
    data,
  );
};

export const join = async (
  httpClient: StreamClient,
  type: string,
  id: string,
  data?: JoinCallRequest,
) => {
  const joinCallResponse = await watch(httpClient, type, id, data);
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
  const data = {
    latency_measurements: await measureLatencyToEdges(edges),
  };
  // FIXME OL: remove this once cascading is enabled by default
  const cascadingModeParams = getCascadingModeParams();
  if (cascadingModeParams) {
    return httpClient.doAxiosRequest<
      GetCallEdgeServerResponse,
      GetCallEdgeServerRequest
    >('post', `/call/${type}/${id}/get_edge_server`, data, {
      params: {
        ...cascadingModeParams,
      },
    });
  }

  return httpClient.post<GetCallEdgeServerResponse, GetCallEdgeServerRequest>(
    `/call/${type}/${id}/get_edge_server`,
    data,
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
