import type { Call } from '@stream-io/video-react-sdk';

export const getConnectionString = (call: Call): string => {
  const cid = call.cid;
  const apiKey = call.streamClient.key;
  const token = call.streamClient.tokenManager.getToken();

  return `${cid}@${apiKey}:${token}`;
};
