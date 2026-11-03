import type { NextApiRequest, NextApiResponse } from 'next';

import { getValidServerSession } from './auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: { sizeLimit: '128kb' },
    responseLimit: false,
  },
  maxDuration: 300,
};

const liveCallStats = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getValidServerSession(req, res);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const baseUrl = process.env.RTC_STATS_BASE_URL;
  const apiToken = process.env.RTC_STATS_API_TOKEN;
  if (!baseUrl || !apiToken) {
    return res.status(503).json({
      message:
        'Live call diagnostics are not configured. RTC_STATS_BASE_URL and RTC_STATS_API_TOKEN are required.',
    });
  }

  const controller = new AbortController();
  res.once('close', () => controller.abort());

  try {
    const upstream = await fetch(
      `${baseUrl.replace(/\/$/, '')}/api/live-call-stats`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/x-ndjson',
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
        cache: 'no-store',
        signal: controller.signal,
      },
    );

    if (!upstream.ok || !upstream.body) {
      const message = (await upstream.text()).slice(0, 2000);
      return res.status(upstream.status).json({
        message: message || 'RTC stats service rejected the request',
      });
    }

    res.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/x-ndjson',
      'X-Accel-Buffering': 'no',
    });

    const reader = upstream.body.getReader();
    while (!controller.signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    if (controller.signal.aborted) return;
    console.error('Live call stats proxy failed', error);
    if (!res.headersSent) {
      return res
        .status(502)
        .json({ message: 'RTC stats service is unavailable' });
    }
    res.end();
  }
};

export default liveCallStats;
