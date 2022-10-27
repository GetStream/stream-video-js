import { sign } from 'react-native-pure-jwt';

export const createToken = async (userId: string, jwtSecret: string) => {
  return await sign(
    {
      iss: 'stream-video-js@v0.0.0',
      sub: `user/${userId}`,
      iat: Math.round(Date.now() / 10000),
      user_id: userId,
    },
    jwtSecret,
    {
      alg: 'HS256',
    },
  );
};
