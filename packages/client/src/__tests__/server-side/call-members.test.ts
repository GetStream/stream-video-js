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

  it('add or update members', async () => {
    const response = await call.updateCallMembers({
      update_members: [
        { user_id: 'sara' },
        { user_id: 'jane', role: 'admin' },
        { user_id: 'jack', role: 'admin' },
      ],
    });

    expect(response.members[0].user_id).toBe('sara');
    expect(response.members[1].user_id).toBe('jane');
    expect(response.members[1].role).toBe('admin');
    expect(response.members[2].user_id).toBe('jack');
    expect(response.members[2].role).toBe('admin');
  });

  it('remove members', async () => {
    const response = await call.updateCallMembers({
      remove_members: ['sara'],
    });

    expect(response.duration).toBeDefined();
  });

  it('query members', async () => {
    let response = await call.queryMembers();

    let members = response.members;
    expect(members.length).toBe(3);

    const queryMembersReq = {
      sort: [{ field: 'user_id', direction: 1 }],
      limit: 2,
    };
    response = await call.queryMembers(queryMembersReq);

    members = response.members;
    expect(members.length).toBe(2);
    expect(members[0].user_id).toBe('jack');
    expect(members[1].user_id).toBe('jane');

    response = await call.queryMembers({
      ...queryMembersReq,
      next: response.next,
    });

    expect(response.members.length).toBe(1);

    response = await call.queryMembers({
      filter_conditions: { role: { $eq: 'admin' } },
    });
  });
});
