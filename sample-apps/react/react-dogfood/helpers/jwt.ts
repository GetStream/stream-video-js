import { StreamClient } from '@stream-io/node-sdk';
import { decodeBase64 } from 'stream-chat';

/**
 * The maximum validity of a token, in seconds.
 * Defaults to 7 days.
 */
export const maxTokenValidityInSeconds: number =
  Number(process.env.MAX_TOKEN_EXP_IN_SECONDS) || 7 * 24 * 60 * 60; // 7 days

export const createToken = (
  userId: string,
  apiKey: string,
  jwtSecret: string,
  params: Record<string, string | string[]> = {},
) => {
  const client = new StreamClient(apiKey, jwtSecret);

  const {
    exp, // expiration, in seconds from now
    ...rest
  } = params;

  return client.generateUserToken({
    iss: 'https://pronto.getstream.io',
    sub: `user/${userId}`,
    user_id: userId,
    validity_in_seconds: exp
      ? parseInt(exp as string, 10)
      : maxTokenValidityInSeconds,
    ...rest,
  });
};

export const decodeToken = (token: string): Record<string, any> => {
  const [, payload] = token.split('.');
  if (!payload) throw new Error('Malformed token, missing payload');
  try {
    return JSON.parse(decodeBase64(payload)) ?? {};
  } catch (e) {
    console.log('Error parsing token payload', e);
    return {};
  }
};
