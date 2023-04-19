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
  const queryParams = new URLSearchParams(args as Record<string, string>);

  // handle the special case /pronto --edges
  if (queryParams.get('edges')) {
    const message = await listAvailableEdges(client);
    return res.status(200).json(message);
  }

  try {
    let [type, id] = queryParams.get('cid')?.split(':') || [];
    if (!id && type) {
      id = type;
      type = 'default';
    }
    const call = client.call(type || 'default', id || meetingId());
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
        queryParams.toString() && `?${queryParams.toString()}`,
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

const listAvailableEdges = async (client: StreamVideoClient) => {
  const { edges } = await client.edges();
  return {
    response_type: 'ephemeral', // notify just the initiator
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Edges: \`\`\`${JSON.stringify(edges, null, 2)}\`\`\``,
        },
      },
    ],
  };
};

export default createCallSlackHookAPI;
