import type { NextApiRequest, NextApiResponse } from 'next';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import yargs from 'yargs';
import { meetingId } from '../../../lib/meetingId';
import { createToken } from '../../../helpers/jwt';

const apiKey = process.env.STREAM_API_KEY as string;
const secretKey = process.env.STREAM_SECRET_KEY as string;

const createCallSlackHookAPI = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const token = createToken('pronto-hook', secretKey);
  const client = new StreamVideoClient(apiKey, {
    browser: false,
    secret: secretKey,
    allowServerSideConnect: true,
  });
  await client.connectUser(
    {
      id: 'pronto-hook',
      name: 'Pronto Slack Hook',
      role: 'bot',
      teams: ['@stream-io/pronto'],
    },
    token,
  );

  console.log(`Received input`, req.body);
  const initiator = req.body.user_name || 'Stream Pronto Bot';
  const { _, $0, ...args } = await yargs().parse(req.body.text || '');
  const queryParams = new URLSearchParams(
    args as Record<string, string>,
  ).toString();

  try {
    const call = client.call('default', meetingId());
    await call.getOrCreate({
      ring: false,
    });
    if (call) {
      const protocol = req.headers['x-forwarded-proto']
        ? 'https://'
        : 'http://';

      const joinUrl = [
        protocol,
        req.headers.host,
        '/join/',
        call.id,
        queryParams && `?${queryParams}`,
      ]
        .filter(Boolean)
        .join('');
      return res.status(200).json({
        response_type: 'in_channel',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${initiator} has invited you for a new Stream Call \n ${joinUrl}`,
            },
            accessory: {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Join Now',
                emoji: true,
              },
              url: joinUrl,
              action_id: 'button-action',
            },
          },
        ],
      });
    }
    return res.status(200).json(notifyError('Failed to getOrCreateCall'));
  } catch (e) {
    console.error(e);
    // @ts-ignore
    return res.status(200).json(notifyError(e.message));
  } finally {
    await client.disconnectUser();
  }
};

const notifyError = (message: string) => {
  return {
    response_type: 'ephemeral', // notify just the initiator
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `An error occurred: [\`${message}\`]`,
        },
      },
    ],
  };
};

export default createCallSlackHookAPI;
