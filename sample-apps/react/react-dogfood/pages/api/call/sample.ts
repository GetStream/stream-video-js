import { NextApiRequest, NextApiResponse } from 'next';
import names from 'starwars-names';
import { meetingId } from '../../../lib/meetingId';
import { createToken } from '../../../helpers/jwt';

export type AppConfig = {
  apiKey?: string;
  secret?: string;
  // a link to the app that can be opened in a browser:
  // https://sample.app/rooms/join/{type}/{id}?user_id={userId}&user_name={user_name}&token={token}&api_key={api_key}
  // supported replacements:
  // - {type}, {id},
  // - {userId}, {user_name}, {token},
  // - {api_key}
  deepLink?: string;
  defaultCallType?: string;
};

export type SampleAppCallConfig = {
  [appType: string]: AppConfig | undefined;
};

type CreateSampleAppCallResponse = {
  apiKey: string;
  userId: string;
  userName: string;
  token: string;
  buddyUserId: string;
  buddyUserName: string;
  buddyToken: string;
  callId: string;
  callType?: string;
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
  const userId = toUserId(userName);
  const token = createToken(userId, appConfig.secret);
  const buddyUserName = getBuddyUserName(userName);
  const buddyUserId = toUserId(buddyUserName);
  const buddyToken = createToken(buddyUserId, appConfig.secret);

  const callId = meetingId();
  const callType = data.call_type || appConfig.defaultCallType || 'default';

  const deepLink = appConfig.deepLink
    ?.replace('{type}', encodeURIComponent(callType))
    .replace('{id}', encodeURIComponent(callId))
    .replace('{user_name}', encodeURIComponent(buddyUserName))
    .replace('{user_id}', encodeURIComponent(buddyUserId))
    .replace('{token}', encodeURIComponent(buddyToken))
    .replace('{api_key}', encodeURIComponent(appConfig.apiKey));

  const response: CreateSampleAppCallResponse = {
    apiKey: appConfig.apiKey,
    callId,
    callType,
    userId,
    userName,
    token,
    buddyUserId,
    buddyUserName,
    buddyToken,
    deepLink,
  };

  return res.status(200).json(response);
}

const toUserId = (userName: string): string =>
  userName.replace(/[^_\-0-9a-zA-Z@]/g, '_');

const getBuddyUserName = (userName: string): string => {
  let buddy: string;
  do {
    buddy = names.random();
  } while (buddy === userName);

  return buddy;
};
