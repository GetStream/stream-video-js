import type { NextApiRequest, NextApiResponse } from 'next';
import { StreamVideoClient } from '@stream-io/video-client';
import { v4 as uuidv4 } from 'uuid';
import { createToken } from '../../../helpers/jwt';

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

  try {
    const response = await client.getOrCreateCall({
      id: uuidv4(),
      type: 'default',
    });
    if (response.call) {
      const { call } = response.call;
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
              text: `(Join Stream Video)[${joinUrl}]`,
            },
          },
        ],
      });
    }
    return res.status(400).json({ error: 'Failed to getOrCreate call' });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: e.message });
  }
};

export default createCallSlackHookAPI;
