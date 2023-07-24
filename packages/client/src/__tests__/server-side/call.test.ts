import 'dotenv/config';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { StreamVideoServerClient } from '../../StreamVideoServerClient';
import { generateUUIDv4 } from '../../coordinator/connection/utils';
import { Call } from '../../Call';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

describe('call API', () => {
  let client: StreamVideoServerClient;
  const callId = `call${generateUUIDv4()}`;
  let call: Call;

  beforeAll(() => {
    client = new StreamVideoServerClient(apiKey, {
      secret,
      logLevel: 'error',
    });

    call = client.call('default', callId);
  });

  it('create', async () => {
    const response = await call.getOrCreate({
      data: { created_by_id: 'john' },
    });

    expect(response.call.created_by.id).toBe('john');
  });

  it('update', async () => {
    const response = await call.update({
      settings_override: {
        audio: { mic_default_on: true, default_device: 'speaker' },
      },
      custom: { color: 'red' },
    });

    expect(response.call.settings.audio.mic_default_on).toBe(true);
    expect(response.call.custom.color).toBe('red');
  });

  it('RTMP address', async () => {
    const resp = await call.getOrCreate();
    const address = resp.call.ingress.rtmp.address;

    expect(address).toBeDefined();
  });
});
