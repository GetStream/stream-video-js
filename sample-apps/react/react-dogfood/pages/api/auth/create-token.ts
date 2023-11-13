import { NextApiRequest, NextApiResponse } from 'next';
import { createToken, maxTokenValidityInSeconds } from '../../../helpers/jwt';
import { SampleAppCallConfig } from '../call/sample';

const config: SampleAppCallConfig = JSON.parse(
  process.env.SAMPLE_APP_CALL_CONFIG || '{}',
);

export type AppName = 'pronto' | 'demo' | string;

export type CreateJwtTokenErrorResponse = {
  error: string;
};

export type CreateJwtTokenResponse = {
  userId: string;
  apiKey: string;
  token: string;
  error?: never;
};

export type CreateJwtTokenRequest = {
  user_id: string;
  app_name?: AppName;
  [key: string]: string | undefined;
};

const createJwtToken = async (
  req: NextApiRequest,
  res: NextApiResponse<CreateJwtTokenResponse | CreateJwtTokenErrorResponse>,
) => {
  const { user_id: userId, app_name: appName = 'demo', ...params } = req.query;
  const appConfig = config[appName as AppName];
  if (!appConfig) {
    return error(res, `'app_name' parameter is invalid.`);
  }

  if (!appConfig.apiKey || !appConfig.secret) {
    return res.status(400).json({
      error: `app_name: '${appName}' is not configured properly.`,
    });
  }

  const { apiKey, secret: secretKey } = appConfig;
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
    apiKey,
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
