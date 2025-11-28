import { NextApiRequest, NextApiResponse } from 'next';
import { meetingId } from '../../../lib/idGenerators';
import { createToken } from '../../../helpers/jwt';
import { getRandomName } from '../../../lib/names';
import { getEnvironmentConfig } from '../../../lib/environmentConfig';

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

export default async function createSampleAppCallApi(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    return await createSampleAppCall(req, res);
  } catch (e) {
    return res.status(400).json({
      error: (e as Error).message,
    });
  }
}

async function createSampleAppCall(req: NextApiRequest, res: NextApiResponse) {
  if (!req.query['app_type']) {
    return res.status(400).json({
      error: 'app_type is a mandatory query parameter.',
    });
  }

  const data = req.query as CreateSampleAppCallRequest;
  const appConfig = getEnvironmentConfig(data.app_type);

  const userName = getRandomName();
  const userId = toUserId(userName);
  const token = await createToken(userId, appConfig.apiKey, appConfig.secret);
  const buddyUserName = getBuddyUserName(userName);
  const buddyUserId = toUserId(buddyUserName);
  const buddyToken = await createToken(
    buddyUserId,
    appConfig.apiKey,
    appConfig.secret,
  );

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
    buddy = getRandomName();
  } while (buddy === userName);

  return buddy;
};
