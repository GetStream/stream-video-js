import 'dotenv/config';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getCallInitConcurrencyTag,
  StreamVideoClient,
} from '../StreamVideoClient';
import { StreamClient } from '@stream-io/node-sdk';
import {
  AllClientEvents,
  StreamVideoEvent,
} from '../coordinator/connection/types';
import { CallingState, RxUtils } from '../store';
import { settled } from '../helpers/concurrency';
import { Call } from '../Call';
import { CallCreatedPayload, CallRingPayload } from './data';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

describe('StreamVideoClient Ringing', () => {
  const serverClient = new StreamClient(apiKey, secret);

  let oliverClient: StreamVideoClient;
  let sachaClient: StreamVideoClient;
  let marceloClient: StreamVideoClient;

  beforeEach(async () => {
    const makeClient = async (userId: string) => {
      const client = new StreamVideoClient(apiKey, {
        // tests run in node, so we have to fake being in browser env
        browser: true,
        timeout: 15000,
      });
      const token = serverClient.generateUserToken({ user_id: userId });
      await client.connectUser({ id: userId }, token);
      return client;
    };
    [oliverClient, sachaClient, marceloClient] = await Promise.all([
      makeClient('oliver'),
      makeClient('sacha'),
      makeClient('marcelo'),
    ]);
  });

  afterEach(async () => {
    await Promise.all([
      oliverClient.disconnectUser(),
      sachaClient.disconnectUser(),
      marceloClient.disconnectUser(),
    ]);
  });

  describe('standard ringing', async () => {
    it('server-side: oliver should ring all members', async () => {
      const oliverRing = expectEvent(oliverClient, 'call.ring');
      const sachaRing = expectEvent(sachaClient, 'call.ring');
      const marceloRing = expectEvent(marceloClient, 'call.ring');

      const call = serverClient.video.call('default', crypto.randomUUID());
      await call.create({
        ring: true,
        data: {
          created_by_id: 'oliver',
          members: [
            { user_id: 'oliver' },
            { user_id: 'sacha' },
            { user_id: 'marcelo' },
          ],
        },
      });

      const [oliverRingEvent, sachaRingEvent, marceloRingEvent] =
        await Promise.all([oliverRing, sachaRing, marceloRing]);

      expect(oliverRingEvent.call.cid).toBe(call.cid);
      expect(sachaRingEvent.call.cid).toBe(call.cid);
      expect(marceloRingEvent.call.cid).toBe(call.cid);

      const oliverCall = await expectCall(oliverClient, call.cid);
      const sachaCall = await expectCall(sachaClient, call.cid);
      const marceloCall = await expectCall(marceloClient, call.cid);
      expect(oliverCall).toBeDefined();
      expect(sachaCall).toBeDefined();
      expect(marceloCall).toBeDefined();
      expect(oliverCall.ringing).toBe(true);
      expect(sachaCall.ringing).toBe(true);
      expect(marceloCall.ringing).toBe(true);
    });

    it('client-side: oliver should ring all members', async () => {
      const oliverRing = expectEvent(oliverClient, 'call.ring');
      const sachaRing = expectEvent(sachaClient, 'call.ring');
      const marceloRing = expectEvent(marceloClient, 'call.ring');

      const call = oliverClient.call('default', crypto.randomUUID());
      await call.create({
        ring: true,
        data: {
          members: [
            { user_id: 'oliver' },
            { user_id: 'sacha' },
            { user_id: 'marcelo' },
          ],
        },
      });

      const [oliverRingEvent, sachaRingEvent, marceloRingEvent] =
        await Promise.all([oliverRing, sachaRing, marceloRing]);

      expect(oliverRingEvent.call.cid).toBe(call.cid);
      expect(sachaRingEvent.call.cid).toBe(call.cid);
      expect(marceloRingEvent.call.cid).toBe(call.cid);

      const oliverCall = await expectCall(oliverClient, call.cid);
      const sachaCall = await expectCall(sachaClient, call.cid);
      const marceloCall = await expectCall(marceloClient, call.cid);
      expect(oliverCall).toBeDefined();
      expect(sachaCall).toBeDefined();
      expect(marceloCall).toBeDefined();
      expect(oliverCall.ringing).toBe(true);
      expect(sachaCall.ringing).toBe(true);
      expect(marceloCall.ringing).toBe(true);
    });
  });

  describe('ringing concurrently', async () => {
    it('dispatches `call.ring` before `call.created`', async () => {
      oliverClient.streamClient.dispatchEvent(
        CallRingPayload as StreamVideoEvent,
      );
      oliverClient.streamClient.dispatchEvent(
        CallCreatedPayload as StreamVideoEvent,
      );
      await settled(getCallInitConcurrencyTag(CallCreatedPayload.call_cid));
      expect(oliverClient.state.calls.length).toBe(1);
      expect(oliverClient.state.calls[0].state.callingState).toBe(
        CallingState.RINGING,
      );
    });

    it('dispatches `call.created` then `call.ring`', async () => {
      oliverClient.streamClient.dispatchEvent(
        CallCreatedPayload as StreamVideoEvent,
      );
      oliverClient.streamClient.dispatchEvent(
        CallRingPayload as StreamVideoEvent,
      );

      await settled(getCallInitConcurrencyTag(CallCreatedPayload.call_cid));
      expect(oliverClient.state.calls.length).toBe(1);
      expect(oliverClient.state.calls[0].state.callingState).toBe(
        CallingState.RINGING,
      );
    });

    it('receives a push notification followed by `call.ring` then `call.created`', async () => {
      const call = await oliverClient.onRingingCall(CallRingPayload.call_cid);
      oliverClient.streamClient.dispatchEvent(
        CallRingPayload as StreamVideoEvent,
      );
      oliverClient.streamClient.dispatchEvent(
        CallCreatedPayload as StreamVideoEvent,
      );
      await settled(getCallInitConcurrencyTag(CallRingPayload.call_cid));
      expect(oliverClient.state.calls.length).toBe(1);
      expect(oliverClient.state.calls[0]).toBe(call);
      expect(call.ringing).toBe(true);
    });
  });
});

const expectEvent = async <E extends keyof AllClientEvents>(
  client: StreamVideoClient,
  eventName: E,
  timeout: number = 2500,
): Promise<AllClientEvents[E]> => {
  return new Promise<AllClientEvents[E]>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined = undefined;
    const off = client.on(eventName, (e) => {
      off();
      clearTimeout(timeoutId);
      resolve(e);
    });
    timeoutId = setTimeout(() => {
      off();
      reject(
        new Error(
          `Timeout waiting for event: ${eventName}, user_id: ${client.state.connectedUser?.id}`,
        ),
      );
    }, timeout);
  });
};

const expectCall = async (
  client: StreamVideoClient,
  cid: string,
  timeout: number = 2500,
) => {
  return new Promise<Call>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined = undefined;
    const off = RxUtils.createSubscription(client.state.calls$, (calls) => {
      const call = calls.find((c) => c.cid === cid);
      if (call) {
        clearTimeout(timeoutId);
        resolve(call);
      }
    });
    timeoutId = setTimeout(() => {
      off();
      reject(
        new Error(
          `Timeout waiting for call: ${cid}, user_id: ${client.state.connectedUser?.id}`,
        ),
      );
    }, timeout);
  });
};
