import { NextApiRequest, NextApiResponse } from 'next';
import { createToken } from '../../../helpers/jwt';

const secretKey = process.env.STREAM_SECRET_KEY as string;

const createJwtToken = async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = req.query['user_id'] as string;
  if (!userId) {
    return res.status(400).json({
      error: `'user_id' parameter is missing, please provide it.`,
    });
  }

  const params = req.query as Record<string, string>;
  const token = createToken(userId, secretKey, params);
  return res.status(200).json({
    userId,
    token,
  });
};

export default createJwtToken;
