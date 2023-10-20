import type { NextApiRequest, NextApiResponse } from 'next';
import yargs from 'yargs';
import { meetingId } from '../../../lib/meetingId';

const createCallSlackHookAPI = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  console.log(`Received input`, req.body);
  const initiator = req.body.user_name || 'Stream Pronto Bot';
  const { _, $0, ...args } = await yargs().parse(req.body.text || '');
  const queryParams = new URLSearchParams(args as Record<string, string>);

  // handle the special case /pronto --edges
  if (queryParams.get('edges')) {
    const message = await listAvailableEdges();
    return res.status(200).json(message);
  }

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

    const protocol = req.headers['x-forwarded-proto'] ? 'https://' : 'http://';
    const host =
      req.headers.host === 'stream-calls-dogfood.vercel.app'
        ? 'pronto.getstream.io'
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
  } catch (e) {
    console.error(e);
    // @ts-ignore
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

const listAvailableEdges = async () => {
  const chunkedMessages = [
    `
    Static edges:
    sfu-000c954.fdc-ams1.stream-io-video.com
    sfu-039364a.lsw-ams1.stream-io-video.com
    sfu-9c050b4.ovh-lon1.stream-io-video.com
    sfu-9c0dc03.ovh-lim1.stream-io-video.com
    sfu-9f0306f.eqx-nyc1.stream-io-video.com
    sfu-a69b58a.blu-tal1.stream-io-video.com
    sfu-e74550c.aws-sin1.stream-io-video.com
    sfu-f079b1a.dpk-den1.stream-io-video.com
    sfu-dd73d37.aws-mum1.stream-io-video.com
    `,
  ];

  // https://app.slack.com/block-kit-builder/
  // useful too for testing the formatting of the Slack messages
  return {
    response_type: 'ephemeral', // notify just the initiator
    blocks: chunkedMessages.map((msg) => {
      return {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Available edges: \`\`\`${msg.trim()}\`\`\``,
        },
      };
    }),
  };
};

export default createCallSlackHookAPI;
