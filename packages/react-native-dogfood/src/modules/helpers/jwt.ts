import { sign } from 'react-native-pure-jwt';

export const createToken = async (
  userId: string,
  jwtSecret: string,
  params: Record<string, string | string[]> = {},
) => {
  const { ...rest } = params;

  const token = await sign(
    {
      iss: 'stream-video-js@v0.0.0',
      sub: `user/${userId}`,
      iat: Math.round(Date.now() / 1000) - 3000,
      user_id: userId,
      ...rest,
    },
    jwtSecret,
    {
      alg: 'HS256',
    },
  );
  return token;
};
