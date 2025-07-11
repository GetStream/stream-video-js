import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import { StreamClient } from '@stream-io/node-sdk';
import { AllClientEvents } from '../coordinator/connection/types';
import { RxUtils } from '../store';
import { Call } from '../Call';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

describe('StreamVideoClient Ringing', () => {
  const serverClient = new StreamClient(apiKey, secret);

  let oliverClient: StreamVideoClient;
  let sachaClient: StreamVideoClient;
  let marceloClient: StreamVideoClient;

  beforeAll(async () => {
    const makeClient = async (userId: string) => {
      const client = new StreamVideoClient(apiKey, {
        // tests run in node, so we have to fake being in browser env
        browser: true,
        timeout: 15000,
      });
      await client.connectUser(
        { id: userId },
        serverClient.generateUserToken({ user_id: userId }),
      );
      return client;
    };
    [oliverClient, sachaClient, marceloClient] = await Promise.all([
      makeClient('oliver'),
      makeClient('sacha'),
      makeClient('marcelo'),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      oliverClient.disconnectUser(),
      sachaClient.disconnectUser(),
      marceloClient.disconnectUser(),
    ]);
  });

  describe('standard ringing', async () => {
    it.each(['oliver', 'sara'])(
      'server-side: %s should ring all members, call creator should get call.ring event if present in members',
      async (creatorId: string) => {
        const oliverRing = expectEvent(oliverClient, 'call.ring');
        const sachaRing = expectEvent(sachaClient, 'call.ring');
        const marceloRing = expectEvent(marceloClient, 'call.ring');

        const call = serverClient.video.call('default', crypto.randomUUID());
        await call.create({
          ring: true,
          data: {
            created_by_id: creatorId,
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
      },
    );
  });

  describe('ringing individual members', () => {
    it('should ring individual members', async () => {
      const oliverCall = oliverClient.call('default', crypto.randomUUID());
      await oliverCall.create({
        ring: false, // don't ring all members by default
        data: {
          members: [
            { user_id: 'oliver' },
            { user_id: 'sacha' },
            { user_id: 'marcelo' },
          ],
        },
      });

      // no one should get a ring event yet
      const oliverRing = expectEvent(oliverClient, 'call.ring', 500);
      const sachaRing = expectEvent(sachaClient, 'call.ring', 500);
      const marceloRing = expectEvent(marceloClient, 'call.ring', 500);
      await expect(
        Promise.all([oliverRing, sachaRing, marceloRing]),
      ).rejects.toThrow();

      // oliver is calling sacha. only sacha should get a ring event
      const sachaIndividualRing = expectEvent(sachaClient, 'call.ring');
      const marceloIndividualRing = expectEvent(marceloClient, 'call.ring');
      await oliverCall.ring({ target_member_ids: ['sacha'] });
      await expect(sachaIndividualRing).resolves.toHaveProperty(
        'call.cid',
        oliverCall.cid,
      );
      await expect(marceloIndividualRing).rejects.toThrow();

      const sachaCall = await expectCall(sachaClient, oliverCall.cid);
      expect(sachaCall).toBeDefined();

      // sacha is calling marcelo. only marcelo should get a ring event
      const oliverIndividualRing = expectEvent(oliverClient, 'call.ring');
      const marceloIndividualRing2 = expectEvent(marceloClient, 'call.ring');
      await sachaCall.ring({ target_member_ids: ['marcelo'] });
      await expect(marceloIndividualRing2).resolves.toHaveProperty(
        'call.cid',
        sachaCall.cid,
      );
      await expect(oliverIndividualRing).rejects.toThrow();

      const marceloCall = await expectCall(marceloClient, sachaCall.cid);
      expect(marceloCall).toBeDefined();
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
