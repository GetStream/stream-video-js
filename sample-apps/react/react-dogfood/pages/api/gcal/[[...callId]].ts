import { StreamClient } from '@stream-io/node-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { meetingId } from '../../../lib/idGenerators';

const upsertCallFromGcal = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const callId = req.method === 'PATCH' ? req.query.callId?.[0] : meetingId();
  const name = req.body.name ?? 'Pronto Call';

  if (!callId) {
    res.status(400).send('Missing call id');
    return;
  }

  const client = new StreamClient(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_SECRET_KEY!,
  );

  const call = client.video.call('default', callId);

  if (req.method === 'PATCH') {
    await call.update({
      custom: { name },
    });
  } else {
    await call.create({
      data: {
        custom: { name },
        created_by: {
          id: 'pronto-gcal',
          name: 'Pronto Calendar Integration',
          role: 'stream',
        },
      },
    });
  }

  return res.status(200).send(callId);
};

export default upsertCallFromGcal;
