import jwt from 'jsonwebtoken';

export const createToken = (
  userId: string,
  jwtSecret: string,
  params: Record<string, string> = {},
) => {
  const {
    exp, // expiration, in seconds from now
    ...rest
  } = params;
  const expiration = exp ? Date.now() / 1000 + parseInt(exp, 10) : undefined;
  return jwt.sign(
    {
      iss: 'stream-video-js@v0.0.0',
      sub: `user/${userId}`,
      // subtract 3 seconds, sometimes the coordinator fails with
      // "token used before issued at (iat)" error
      iat: Math.round(Date.now() / 1000) - 3000,
      exp: Math.round(expiration),
      user_id: userId,
      ...rest,
    },
    jwtSecret,
  );
};
