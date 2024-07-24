import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import 'dotenv/config';
import { StreamClient } from '@stream-io/node-sdk';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { CallingState } from '../store';
import { Dispatcher } from '../rtc';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;
const serverClient = new StreamClient(apiKey, secret);
const userId = 'jane';
const tokenProvider = async () =>
  serverClient.createToken(userId, undefined, Date.now() / 1000 - 10);

let client: StreamVideoClient;

beforeEach(() => {
  client = new StreamVideoClient({
    apiKey,
    options: { browser: true },
    tokenProvider,
    user: { id: 'jane' },
  });
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
  let states: CallingState[] = [];
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

afterEach(() => {
  client.disconnectUser();
});
