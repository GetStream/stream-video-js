import {
  ICEServer,
  JoinCallRequest,
  JoinCallResponse,
} from '../../gen/coordinator';
import {
  isStreamVideoLocalParticipant,
  JoinCallData,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '../../types';
import { StreamClient } from '../../coordinator/connection/client';
import { getLogger } from '../../logger';

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
  await httpClient.connectionIdPromise;

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
  const location = await getLocationHint();
  const request: JoinCallRequest = {
    ...data,
    location,
  };

  // FIXME OL: remove this once cascading is enabled by default
  const cascadingModeParams = getCascadingModeParams();
  if (cascadingModeParams) {
    // FIXME OL: remove after SFU migration is done
    if (data?.migrating_from && cascadingModeParams['next_sfu_id']) {
      cascadingModeParams['sfu_id'] = cascadingModeParams['next_sfu_id'];
    }
    return httpClient.doAxiosRequest<JoinCallResponse, JoinCallRequest>(
      'post',
      `/call/${type}/${id}/join`,
      request,
      {
        params: {
          ...cascadingModeParams,
        },
      },
    );
  }
  return httpClient.post<JoinCallResponse, JoinCallRequest>(
    `/call/${type}/${id}/join`,
    request,
  );
};

const getLocationHint = async () => {
  const hintURL = `https://hint.stream-io-video.com/`;
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 1000);
  const logger = getLogger(['call']);
  try {
    const response = await fetch(hintURL, {
      method: 'HEAD',
      signal: abortController.signal,
    });
    const awsPop = response.headers.get('x-amz-cf-pop') || 'ERR';
    logger?.('info', `Location header: ${awsPop}`);
    return awsPop.substring(0, 3); // AMS1-P2 -> AMS
  } catch (e) {
    logger?.('error', `Failed to get location hint from ${hintURL}`, e);
    return 'ERR';
  } finally {
    clearTimeout(timeoutId);
  }
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

const getCascadingModeParams = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
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

/**
 * Reconciles the local state of the source participant into the target participant.
 *
 * @param target the participant to reconcile into.
 * @param source the participant to reconcile from.
 */
export const reconcileParticipantLocalState = (
  target: StreamVideoParticipant | StreamVideoLocalParticipant,
  source?: StreamVideoParticipant | StreamVideoLocalParticipant,
) => {
  if (!source) return target;

  // Note: MediaStream shouldn't be reconciled as we are going to
  // get a new one from the new SFU in case of a migration or reconnection.
  target.videoDimension = source.videoDimension;
  target.screenShareDimension = source.screenShareDimension;
  target.pinnedAt = source.pinnedAt;
  target.reaction = source.reaction;
  target.viewportVisibilityState = source.viewportVisibilityState;
  if (
    isStreamVideoLocalParticipant(source) &&
    isStreamVideoLocalParticipant(target)
  ) {
    target.audioDeviceId = source.audioDeviceId;
    target.videoDeviceId = source.videoDeviceId;
    target.audioOutputDeviceId = source.audioOutputDeviceId;
  }
  return target;
};
