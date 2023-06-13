import { NextApiRequest, NextApiResponse } from 'next';
import names from 'starwars-names';
import { meetingId } from '../../../lib/meetingId';
import { createToken } from '../../../helpers/jwt';

type AppConfig = {
  apiKey?: string;
  secret?: string;
  // a link to the app that can be opened in a browser:
  // https://video-react-audio-rooms.vercel.app/rooms/join/{type}/{id}?user_id={userId}
  deepLink?: string;
  defaultCallType?: string;
};

type SampleAppCallConfig = {
  [appType: string]: AppConfig | undefined;
};

type CreateSampleAppCallResponse = {
  userId: string;
  userName: string;
  callId: string;
  callType?: string;
  apiKey: string;
  token: string;
  deepLink?: string;
};

type CreateSampleAppCallRequest = {
  app_type: string;
  call_type?: string;
};

const config: SampleAppCallConfig = JSON.parse(
  process.env.SAMPLE_APP_CALL_CONFIG || '{}',
);

export default async function createSampleAppCall(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!req.query['app_type']) {
    return res.status(400).json({
      error: 'app_type is a mandatory query parameter.',
    });
  }

  const data = req.query as CreateSampleAppCallRequest;
  const appConfig = config[data.app_type];
  if (!appConfig) {
    return res.status(400).json({
      error: `app_type '${
        data.app_type
      }' is not supported. Supported types: ${Object.keys(config).join(', ')}`,
    });
  }

  if (!appConfig.apiKey || !appConfig.secret) {
    return res.status(400).json({
      error: `app_type '${data.app_type}' is not configured properly.`,
    });
  }

  const userName = names.random();
  const userId = userName.replace(/[^_\-0-9a-zA-Z@]/g, '_');
  const callId = meetingId();
  const callType = data.call_type || appConfig.defaultCallType || 'default';
  const token = createToken(userId, appConfig.secret);

  const deepLink = appConfig.deepLink
    ?.replace('{type}', callType)
    .replace('{id}', callId)
    .replace('{user_id}', userId);

  const response: CreateSampleAppCallResponse = {
    userId,
    userName,
    callId,
    callType,
    apiKey: appConfig.apiKey,
    token,
    deepLink,
  };

  return res.status(200).json(response);
}
