import { NextApiRequest, NextApiResponse } from 'next';
import { createToken } from '../../../helpers/jwt';

const apiKeyAndSecretWhitelist =
  (process.env.STREAM_API_KEY_AND_SECRET_WHITE_LIST as string) || '';

const secretKeyLookup = apiKeyAndSecretWhitelist
  .trim()
  .replace(/\s+/g, '')
  .split(';')
  .reduce<Record<string, string>>((acc, item) => {
    const [apiKey, secret] = item.trim().split(':');
    if (apiKey && secret) {
      acc[apiKey] = secret;
    }
    return acc;
  }, {});

const createJwtToken = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    user_id: userId,
    api_key: apiKey,
    ...params
  } = req.query as Record<string, string>;

  if (!apiKey) {
    return error(res, `'api_key' parameter is a mandatory query parameter.`);
  }

  const secretKey = secretKeyLookup[apiKey];
  if (!secretKey) {
    return error(res, `'api_key' parameter is invalid.`);
  }

  if (!userId) {
    return error(res, `'user_id' is a mandatory query parameter.`);
  }

  if (!params.exp) {
    const expiration = 3 * 60 * 60;
    params.exp = String(expiration);
  }

  const token = createToken(userId, secretKey, params);
  return res.status(200).json({
    userId,
    token,
  });
};

export default createJwtToken;

const error = (
  res: NextApiResponse,
  message: string,
  statusCode: number = 400,
) => {
  return res.status(statusCode).json({
    error: message,
  });
};
