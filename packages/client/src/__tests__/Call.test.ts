import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  MockInstance,
  vi,
} from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import 'dotenv/config';
import { StreamClient } from '@stream-io/node-sdk';
import { generateUUIDv4, sleep } from '../coordinator/connection/utils';
import { CallingState } from '../store';
import { Dispatcher } from '../rtc';
import { Call } from '../Call';
import { StreamVideoParticipant } from '../types';
import { TrackType } from '../gen/video/sfu/models/models';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;
const serverClient = new StreamClient(apiKey, secret);
const userId = 'jane';
const tokenProvider = async () =>
  serverClient.generateUserToken({ user_id: userId, role: 'user' });

let client: StreamVideoClient;

beforeEach(async () => {
  client = new StreamVideoClient({
    apiKey,
    options: { browser: true },
    tokenProvider,
    user: { id: 'jane' },
  });

  await sleep(50);
  await client.streamClient.wsPromise;
});

it('can get a call', async () => {
  const call = client.call('default', generateUUIDv4());
  expect(call.watching).toBeFalsy();
  await call.getOrCreate();
  expect(call.watching).toBeTruthy();
  await call.leave();
  expect(call.state.callingState).toBe(CallingState.LEFT);
});

it('can reuse call instance', async () => {
  const call = client.call('default', generateUUIDv4());
  await call.getOrCreate();
  expect(call.state.callingState).toBe(CallingState.IDLE);
  await call.leave();
  expect(call.state.callingState).toBe(CallingState.LEFT);
  await call.get();
  expect(call.state.callingState).toBe(CallingState.IDLE);
  await call.leave();
  expect(call.state.callingState).toBe(CallingState.LEFT);
});

it('stops reacting to events when not watching', async () => {
  const call = client.call('default', generateUUIDv4());
  await call.getOrCreate();
  expect(call.state.transcribing).toBeFalsy();
  call.streamClient.dispatchEvent({
    type: 'call.transcription_started',
    call_cid: call.cid,
    created_at: new Date().toISOString(),
  });
  expect(call.state.transcribing).toBeTruthy();
  await call.leave();
  call.streamClient.dispatchEvent({
    type: 'call.transcription_stopped',
    call_cid: call.cid,
    created_at: new Date().toISOString(),
  });
  expect(call.state.transcribing).toBeTruthy();
});

it('keeps user handlers for SFU and coordinator events', async () => {
  const call = client.call('default', generateUUIDv4());
  const sfuEventHandler = vi.fn();
  const coordinatorEventHandler = vi.fn();
  call.on('participantJoined', sfuEventHandler);
  call.on('call.transcription_started', coordinatorEventHandler);
  await call.getOrCreate();
  await call.leave();
  (call as unknown as { dispatcher: Dispatcher }).dispatcher.dispatch({
    eventPayload: {
      oneofKind: 'participantJoined',
      participantJoined: {
        callCid: call.cid,
      },
    },
  });
  call.streamClient.dispatchEvent({
    type: 'call.transcription_started',
    call_cid: call.cid,
    created_at: new Date().toISOString(),
  });
  expect(sfuEventHandler).toBeCalled();
  expect(coordinatorEventHandler).toBeCalled();
});

it("doesn't break when joining and leaving the same instance in quick succession", async () => {
  const call = client.call('default', generateUUIDv4());
  const states: CallingState[] = [];
  call.state.callingState$.subscribe((state) => states.push(state));
  call.getOrCreate();
  call.leave();
  call.getOrCreate();
  call.leave();
  call.getOrCreate();
  await call.leave();
  expect(states).toMatchObject([
    'idle',
    'left',
    'idle',
    'left',
    'idle',
    'left',
  ]);
});

describe('state updates in reponse to coordinator API', () => {
  let call: Call;

  beforeEach(() => {
    call = client.call('default', generateUUIDv4());
  });

  it('should create and update state', async () => {
    await call.create({
      data: {
        members: [{ user_id: 'sara' }],
        settings_override: {
          screensharing: {
            enabled: false,
          },
          audio: {
            default_device: 'earpiece',
          },
        },
      },
    });

    expect(call.state.settings?.screensharing.enabled).toBe(false);
    expect(call.state.settings?.audio.default_device).toBe('earpiece');
    expect(call.state.members.length).toBe(1);
    expect(call.state.members[0].user_id).toBe('sara');
    expect(call.isCreatedByMe).toBe(true);
  });

  it('should get or create and update state', async () => {
    await call.create({
      data: {
        members: [{ user_id: 'sara', role: 'admin' }],
        settings_override: {
          limits: {
            max_participants: 5,
          },
        },
      },
    });

    expect(call.state.settings?.limits.max_participants).toBe(5);
    expect(call.state.members.length).toBe(1);
    expect(call.state.members[0].user_id).toBe('sara');
    expect(call.state.members[0].role).toBe('admin');
  });

  it('should get or create and update state', async () => {
    await call.getOrCreate({
      data: {
        members: [{ user_id: 'sara', role: 'admin' }],
        settings_override: {
          limits: {
            max_participants: 5,
          },
        },
      },
    });

    expect(call.state.settings?.limits.max_participants).toBe(5);
    expect(call.state.members.length).toBe(1);
    expect(call.state.members[0].user_id).toBe('sara');
    expect(call.state.members[0].role).toBe('admin');
  });

  it('should get and update state', async () => {
    await serverClient.video.call(call.type, call.id).create({
      data: {
        settings_override: {
          limits: { max_duration_seconds: 180 },
        },
        created_by_id: userId,
      },
    });

    await call.get();

    expect(call.state.settings?.limits.max_duration_seconds).toBe(180);
  });

  it('should ring', async () => {
    await call.getOrCreate({ ring: true });

    expect(call.ringing).toBe(true);

    await call.leave();
  });

  it('should query call members', async () => {
    await call.getOrCreate({
      data: {
        members: [
          { user_id: 'sara', role: 'admin' },
          { user_id: 'jane' },
          { user_id: 'jack' },
        ],
      },
    });

    // default sorting
    let result = await call.queryMembers();

    expect(result.members.length).toBe(3);

    // sorting and pagination
    const queryMembersReq = {
      sort: [{ field: 'user_id', direction: 1 }],
      limit: 2,
    };
    result = await call.queryMembers(queryMembersReq);

    expect(result.members.length).toBe(2);
    expect(result.members[0].user_id).toBe('jack');
    expect(result.members[1].user_id).toBe('jane');

    // loading next page
    result = await call.queryMembers({ ...queryMembersReq, next: result.next });

    expect(result.members.length).toBe(1);

    result = await call.queryMembers({
      filter_conditions: { role: { $eq: 'admin' } },
    });

    expect(result.members.length).toBe(1);
    expect(result.members[0].user_id).toBe('sara');
  });

  afterEach(async () => {
    await serverClient.video.call(call.type, call.id).delete({ hard: true });
  });
});

describe('muting logic', () => {
  let call: Call;
  let spy: MockInstance;

  beforeEach(async () => {
    call = client.call('default', generateUUIDv4());
    call.state.updateOrAddParticipant('1', {
      userId: 'sara',
      publishedTracks: [TrackType.AUDIO],
    } as StreamVideoParticipant);

    spy = vi
      .spyOn(call, 'muteUser')
      .mockImplementation(() => Promise.resolve({ duration: '0ms' }));
  });

  it('should mute self', async () => {
    await call.muteSelf('audio');

    expect(spy).toHaveBeenCalledWith(userId, 'audio');
  });

  it('should mute others', () => {
    call.muteOthers('video');

    expect(spy).not.toHaveBeenCalled();

    call.muteOthers('audio');

    expect(spy).toHaveBeenCalledWith(['sara'], 'audio');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

afterEach(() => {
  client.disconnectUser();
});
