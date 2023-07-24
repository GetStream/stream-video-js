import 'dotenv/config';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { StreamVideoServerClient } from '../../StreamVideoServerClient';
import { generateUUIDv4 } from '../../coordinator/connection/utils';
import { Call } from '../../Call';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

describe('call members API', () => {
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

  it('create with members', async () => {
    const response = await call.getOrCreate({
      data: {
        created_by_id: 'john',
        members: [{ user_id: 'john', role: 'admin' }, { user_id: 'jack' }],
      },
    });

    expect(response.members[0].user_id).toBe('jack');
    expect(response.members[1].user_id).toBe('john');
    expect(response.members[1].role).toBe('admin');
  });

  it('update members', async () => {
    const response = await call.updateCallMembers({
      update_members: [{ user_id: 'sara', role: 'admin' }],
    });

    expect(response.members[0].user_id).toBe('sara');
    expect(response.members[0].role).toBe('admin');
  });
});
