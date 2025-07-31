import { StreamClient } from '@stream-io/node-sdk';
import { NextApiRequest, NextApiResponse } from 'next';
import getRawBody from 'raw-body';
import { uploadCallRecording } from '../../helpers/gong';
import { saveParticipantAsCallMember } from '../../helpers/participants';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handleWebhook = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).send('not allowed');
  }

  const signature = req.headers['x-signature'];

  if (typeof signature !== 'string') {
    res.status(402).send('no signature');
    return;
  }

  getRawBody(req, { encoding: 'utf-8' }, (err, body) => {
    if (err) {
      res.status(400).send('cannot read body');
      return;
    }

    const client = new StreamClient(
      process.env.STREAM_API_KEY!,
      process.env.STREAM_SECRET_KEY!,
    );
    const isVerified = client.verifyWebhook(body, signature);

    if (!isVerified) {
      res.status(402).send('signature mismatch');
      return;
    }

    let event: any;
    let processor:
      | ((client: StreamClient, event: any) => Promise<void>)
      | undefined;

    try {
      event = JSON.parse(body);
    } catch {
      res.status(400).send('body is not valid json');
      return;
    }

    if (event.type === 'call.recording_ready') {
      processor = uploadCallRecording;
    } else if (event.type === 'call.session_participant_joined') {
      processor = saveParticipantAsCallMember;
    }

    processor?.(client, event)
      .catch((processorErr) => {
        console.error('Processing webhook failed', processorErr);
      })
      .then(() => {
        res.status(200).send('ok');
      });
  });
};

export default handleWebhook;
