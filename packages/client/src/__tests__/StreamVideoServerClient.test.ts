import { StreamVideoServerClient } from '../StreamVideoServerClient';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';
import { generateUUIDv4 } from '../coordinator/connection/utils';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;
console.log(apiKey, secret);
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

  // TODO: figure out how to put these into separate tests, and run those tests sequentially
  it('call types CRUD API', async () => {
    const callTypeName = `calltype${generateUUIDv4()}`;

    // create
    const createResponse = await client.createCallType({ name: callTypeName });

    expect(createResponse.name).toBe(callTypeName);

    // read
    const readResponse = await client.listCallTypes();

    expect(readResponse.call_types[callTypeName]).toContain({
      name: callTypeName,
    });

    // update
    const updateResponse = await client.updateCallType(callTypeName, {
      settings: {
        audio: { mic_default_on: false, default_device: 'earpiece' },
      },
    });

    expect(updateResponse.settings.audio.mic_default_on).toBeFalsy();
    expect(updateResponse.settings.audio.default_device).toBe('earpiece');

    // delete
    await client.deleteCallType(callTypeName);

    await expect(() => client.getCallType(callTypeName)).rejects.toThrowError();
  }, 10000);
});
