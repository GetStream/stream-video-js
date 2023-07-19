import { StreamVideoServerClient } from '../StreamVideoServerClient';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';
import { generateUUIDv4 } from '../coordinator/connection/utils';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

describe('StreamVideoServerClient - docs snippets', () => {
  let client: StreamVideoServerClient;

  beforeEach(() => {
    client = new StreamVideoServerClient(apiKey, {
      secret,
      // turn off
      logger: () => {},
    });
  });

  describe('creating tokens', () => {
    const userId = 'john';

    it('with no expiration', () => {
      const token = client.createToken(userId);
      const decodedToken = jwt.verify(token, secret) as any;

      expect(decodedToken.user_id).toBe(userId);
    });

    it('with expiration and issued at provided', () => {
      const exp = Math.round(new Date().getTime() / 1000) + 60 * 60;
      const iat = Math.round(new Date().getTime() / 1000);
      const token = client.createToken(userId, exp, iat);
      const decodedToken = jwt.verify(token, secret) as any;

      expect(decodedToken.exp).toBe(exp);
      expect(decodedToken.iat).toBe(iat);
    });

    it('with call IDs provided', () => {
      const call_cids = ['default:call1', 'livestream:call2'];
      const token = client.createToken(userId, undefined, undefined, call_cids);
      const decodedToken = jwt.verify(token, secret) as any;

      expect(decodedToken.call_cids).toEqual(call_cids);
    });
  });

  describe('call type CRUD API', () => {
    const callTypeName = `calltype${generateUUIDv4()}`;

    it('create', async () => {
      const createResponse = await client.createCallType({
        name: callTypeName,
      });

      expect(createResponse.name).toBe(callTypeName);
    });

    it('read', async () => {
      const readResponse = await client.getCallTypes();

      expect(readResponse.call_types[callTypeName]).toContain({
        name: callTypeName,
      });
    });

    it('update', async () => {
      const updateResponse = await client.updateCallType(callTypeName, {
        settings: {
          audio: { mic_default_on: false, default_device: 'earpiece' },
        },
      });

      expect(updateResponse.settings.audio.mic_default_on).toBeFalsy();
      expect(updateResponse.settings.audio.default_device).toBe('earpiece');
    });

    it('delete', async () => {
      await client.deleteCallType(callTypeName);

      await expect(() =>
        client.getCallType(callTypeName),
      ).rejects.toThrowError();
    });
  });
});
