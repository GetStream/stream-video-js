import { NextApiRequest, NextApiResponse } from 'next';
import { createToken, maxTokenValidityInSeconds } from '../../../helpers/jwt';

const apiKeyAndSecretWhitelist =
  (process.env.STREAM_API_KEY_AND_SECRET_WHITE_LIST as string) || '';

const streamApiKey = process.env.STREAM_API_KEY;
const streamSecret = process.env.STREAM_SECRET_KEY;

const secretKeyLookup = apiKeyAndSecretWhitelist
  .trim()
  .replace(/\s+/g, '')
  .split(';')
  .reduce<Record<string, string>>(
    (acc, item) => {
      const [apiKey, secret] = item.trim().split(':');
      if (apiKey && secret) {
        acc[apiKey] = secret;
      }
      return acc;
    },
    // whitelist current application's api key and secret
    streamApiKey && streamSecret ? { [streamApiKey]: streamSecret } : {},
  );

const createJwtToken = async (req: NextApiRequest, res: NextApiResponse) => {
  const { user_id: userId, api_key: apiKey, ...params } = req.query;

  if (!apiKey || typeof apiKey !== 'string') {
    return error(res, `'api_key' parameter is a mandatory query parameter.`);
  }

  const secretKey = secretKeyLookup[apiKey];
  if (!secretKey) {
    return error(res, `'api_key' parameter is invalid.`);
  }

  if (!userId || typeof userId !== 'string') {
    return error(res, `'user_id' is a mandatory query parameter.`);
  }

  if (!params.exp) {
    params.exp = String(maxTokenValidityInSeconds);
  }

  // by default, we support repeated query params:
  // - ?call_cids=cid:1&call_cids=cid:2
  // but, we also support other formats:
  // - comma separated ?call_cids=cid:1,cid:2
  // - json encoded ?call_cids=["cid:1","cid:2"]
  if (typeof params.call_cids === 'string') {
    try {
      // support `?call_cids=["cid:1","cid:2"]` query param
      params.call_cids = JSON.parse(params.call_cids);
    } catch (e) {
      // support ?call_cids=cid:1,cid:2 query param
      params.call_cids = (params.call_cids as string)
        .split(',')
        .map((cid) => cid.trim());
    }
  }

  const token = createToken(
    userId,
    secretKey,
    params as Record<string, string | string[]>,
  );
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
