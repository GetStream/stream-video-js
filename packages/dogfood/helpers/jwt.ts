import jwt from 'jsonwebtoken';

export const createToken = (userId: string, jwtSecret: string) => {
  return jwt.sign(
    {
      iss: 'stream-video-js@v0.0.0',
      sub: `user/${userId}`,
      iat: Math.round(Date.now() / 10000),
      user_id: userId,
    },
    jwtSecret,
  );
};
