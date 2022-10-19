import type { NextApiRequest, NextApiResponse } from 'next';
import { StreamVideoClient } from '@stream-io/video-client';
import { createToken } from '../../../helpers/jwt';
import { meetingId } from '../../../lib/meetingId';

const coordinatorApiUrl = process.env.STREAM_COORDINATOR_RPC_URL as string;
const apiKey = process.env.STREAM_API_KEY as string;
const secretKey = process.env.STREAM_SECRET_KEY as string;

const createCallSlackHookAPI = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const client = new StreamVideoClient(apiKey, {
    coordinatorRpcUrl: coordinatorApiUrl,
    sendJson: true,
    token: createToken('admin@getstream.io', secretKey),
  });

  console.log(`Received input`, req.body);
  const initiator = req.body.user_name || 'Stream';

  try {
    const response = await client.getOrCreateCall({
      id: meetingId(),
      type: 'default',
    });
    if (response.call) {
      const call = response.call;
      const protocol = req.headers['x-forwarded-proto']
        ? 'https://'
        : 'http://';

      const joinUrl = [protocol, req.headers.host, '/join/', call.id].join('');
      return res.status(200).json({
        response_type: 'in_channel',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${initiator} has invited for a new Stream Call \n ${joinUrl}`,
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
    return res.status(200).json(notifyError(e.message));
  }
};

const notifyError = (message) => {
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
