import { JWTUserToken } from 'stream-chat';

/**
 * The maximum validity of a token, in seconds.
 * Defaults to 7 days.
 */
export const maxTokenValidityInSeconds: number =
  Number(process.env.MAX_TOKEN_EXP_IN_SECONDS) || 7 * 24 * 60 * 60; // 7 days

export const createToken = (
  userId: string,
  jwtSecret: string,
  params: Record<string, string | string[]> = {},
) => {
  const {
    exp, // expiration, in seconds from now
    ...rest
  } = params;

  const expiryFromNowInSeconds = exp
    ? parseInt(exp as string, 10)
    : maxTokenValidityInSeconds;
  const expiration = Math.round(
    Date.now() / 1000 +
      Math.min(expiryFromNowInSeconds, maxTokenValidityInSeconds),
  );

  const payload: Record<string, unknown> = {
    iss: 'https://pronto.getstream.io',
    sub: `user/${userId}`,
    // subtract 5 seconds, sometimes the coordinator fails with
    // "token used before issued at (iat)" error
    iat: Math.round(Date.now() / 1000) - 5,
    ...rest,
    user_id: userId,
    exp: expiration,
  };

  return JWTUserToken(jwtSecret, userId, payload);
};
