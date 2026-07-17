import type { NextApiRequest, NextApiResponse } from 'next';
import yargs from 'yargs';
import { meetingId } from '../../../lib/idGenerators';
import { getRandomWords } from '../../../lib/names';

/**
 * A yargs-parsed flag counts as "set" when present, unless explicitly negated
 * (`--no-e2ee` -> false, or `--e2ee=false`). Bare `--e2ee` / `--private` parse
 * to `true`, which URLSearchParams stringifies to `"true"`.
 */
const isFlagSet = (value: string | null): boolean =>
  value !== null && value !== 'false' && value !== '0';

const createCallSlackHookAPI = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  console.log(`Received input`, req.body);
  const initiator = req.body.user_name || 'Stream Pronto Bot';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _, $0, ...args } = await yargs().parse(req.body.text || '');
  const queryParams = new URLSearchParams(args as Record<string, string>);

  try {
    const cid = queryParams.get('cid');
    if (cid) {
      queryParams.delete('cid');
    }
    let [type, id] = cid?.split(':') || [];
    if (!id && type) {
      id = type;
      type = 'default';
    }

    if (!id) {
      id = meetingId();
    }

    if (type && type !== 'default') {
      queryParams.set('type', type);
    }

    const staging = queryParams.get('staging');
    if (staging) {
      queryParams.delete('staging');
    }

    const withE2ee =
      isFlagSet(queryParams.get('e2ee')) ||
      isFlagSet(queryParams.get('private'));
    queryParams.delete('e2ee');
    queryParams.delete('private');
    if (withE2ee) {
      queryParams.set('encryption_key', getRandomWords(3));
    }

    const protocol = req.headers['x-forwarded-proto'] ? 'https://' : 'http://';
    const host =
      req.headers.host === 'stream-calls-dogfood.vercel.app'
        ? `${staging ? 'pronto-staging' : 'pronto'}.getstream.io`
        : req.headers.host;
    const joinUrl = [
      protocol,
      host,
      '/join/',
      id,
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
            text: `${initiator} has invited you for a new Stream Call${
              withE2ee ? ' :lock: _(end-to-end encrypted)_' : ''
            } \n ${joinUrl}`,
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
  } catch (e) {
    console.error(e);
    // @ts-expect-error error handling
    return res.status(200).json(notifyError(e.message));
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
