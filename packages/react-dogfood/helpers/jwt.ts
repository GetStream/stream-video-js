import { JWTUserToken } from 'stream-chat';

export const createToken = (
  userId: string,
  jwtSecret: string,
  params: Record<string, string | string[]> = {},
) => {
  const {
    exp, // expiration, in seconds from now
    ...rest
  } = params;

  const maxValidityInSeconds = 3 * 60 * 60;
  const expiryFromNowInSeconds = exp
    ? parseInt(exp as string, 10)
    : maxValidityInSeconds;
  const expiration = Math.round(
    Date.now() / 1000 + Math.min(expiryFromNowInSeconds, maxValidityInSeconds),
  );

  const payload: Record<string, unknown> = {
    iss: 'pronto',
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
