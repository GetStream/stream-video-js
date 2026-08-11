import type { NextApiRequest, NextApiResponse } from 'next';
import yargs from 'yargs';
import { meetingId } from '../../../lib/idGenerators';
import { getRandomWords } from '../../../lib/names';

/**
 * A flag counts as "set" when present, unless explicitly negated (`--no-e2ee`
 * -> false, or `e2ee=false`). Bare `--e2ee` / `--private` parse to `true`, and
 * a bare `?e2ee` query param arrives as an empty string; both count as set.
 */
const isFlagSet = (value: string | null): boolean =>
  value !== null && value !== 'false' && value !== '0';

/**
 * Flags reach this endpoint two ways: as real query params on a direct request
 * (`/api/call/create?cid=default:standup&e2ee`), or inside the Slack slash
 * command text (`/call --cid=default:standup --e2ee`), which yargs parses.
 * Both are merged into one set, and the body wins on collision.
 */
const collectFlags = async (req: NextApiRequest) => {
  const flags = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    // a repeated param (`?type=a&type=b`) collapses to its first value, which
    // is what `URLSearchParams.get` resolves to on the join URL anyway
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue === undefined) continue;
    flags.set(key, firstValue);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _, $0, ...args } = await yargs().parse(req.body?.text || '');
  for (const [key, value] of Object.entries(args)) {
    flags.set(key, String(value));
  }

  return flags;
};

const createCallSlackHookAPI = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  console.log(`Received input`, { query: req.query, body: req.body });

  try {
    const queryParams = await collectFlags(req);

    const initiator =
      req.body?.user_name ||
      queryParams.get('user_name') ||
      'Stream Pronto Bot';
    queryParams.delete('user_name');

    const cid = queryParams.get('cid');
    queryParams.delete('cid');

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

    const staging = isFlagSet(queryParams.get('staging'));
    queryParams.delete('staging');

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
