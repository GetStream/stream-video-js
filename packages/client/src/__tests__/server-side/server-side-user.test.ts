import 'dotenv/config';
import { beforeEach, describe, expect, it } from 'vitest';
import { StreamVideoServerClient } from '../../StreamVideoServerClient';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

describe('server side user connect', () => {
  let client: StreamVideoServerClient;

  beforeEach(() => {
    client = new StreamVideoServerClient(apiKey, {
      browser: false,
      secret,
      allowServerSideConnect: true,
    });
  });

  it('hold up API requests until connect is ready', async () => {
    const userId = 'server-side-test';
    const token = client.createToken(userId);
    client.connectUser({ id: userId }, token);

    const response = await client.queryCalls({});

    expect(response).toBeDefined();
  });
});
