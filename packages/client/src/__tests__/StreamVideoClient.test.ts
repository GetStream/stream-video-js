// import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// import { StreamVideoClient } from '../StreamVideoClient';
// import 'dotenv/config';
// import { generateUUIDv4 } from '../coordinator/connection/utils';
// import { User } from '../coordinator/connection/types';

// const apiKey = process.env.STREAM_API_KEY!;
// const secret = process.env.STREAM_SECRET!;

// const tokenProvider = (userId: string) => {
//   // const serverClient = new StreamVideoServerClient(apiKey, { secret });
//   return async () => {
//     return new Promise<string>((resolve) => {
//       setTimeout(() => {
//         // const token = serverClient.createToken(userId);
//         resolve(token);
//       }, 100);
//     });
//   };
// };

// describe('StreamVideoClient', () => {
//   let client: StreamVideoClient;

//   beforeEach(() => {
//     client = new StreamVideoClient(apiKey, {
//       // tests run in node, so we have to fake being in browser env
//       browser: true,
//     });
//   });

//   it('API calls are hold until connection is done', async () => {
//     const user = {
//       id: 'jane',
//     };

//     client.connectUser(user, tokenProvider(user.id));
//     const response = await client.queryCalls({});

//     expect(response).toBeDefined();
//   });

//   it('API calls are hold until connection is done - anonymous users', async () => {
//     client.connectUser({ type: 'anonymous' });
//     const response = await client.queryCalls({
//       filter_conditions: { members: { $in: ['!anon'] } },
//     });

//     expect(response).toBeDefined();
//   });

//   it('public endpoints can be called without authentication', async () => {
//     const userId = 'guest-' + generateUUIDv4();
//     const response = await client.createGuestUser({
//       user: { id: userId },
//     });

//     expect(response.user.id).toContain(userId);
//   });

//   it(`private endpoints can't be called without authentication`, async () => {
//     await expect(() => client.queryCalls({})).rejects.toThrowError();

//     await client.connectUser({ id: 'jane' }, tokenProvider('jane'));
//     await client.disconnectUser();

//     await expect(() => client.queryCalls({})).rejects.toThrowError();
//   });

//   it('API calls should be enriched with conneciton id', async () => {
//     const user = {
//       id: 'jane',
//     };

//     client.connectUser(user, tokenProvider(user.id));
//     const spy = vi.spyOn(client.streamClient.axiosInstance, 'post');
//     await client.call('default', generateUUIDv4()).getOrCreate();

//     const requestConfig: any = spy.mock.calls[spy.mock.calls.length - 1][2];
//     const params = requestConfig.params;
//     expect(client.streamClient._getConnectionID()).toBeDefined();
//     expect(params['connection_id']).toBe(
//       client.streamClient._getConnectionID(),
//     );
//   });

//   it('API calls should be hold until auth is done - guest user', async () => {
//     const user: User = {
//       id: `jane-${generateUUIDv4()}`,
//       type: 'guest',
//     };

//     client.connectUser(user);
//     const response = await client.queryCalls({
//       filter_conditions: { members: { $in: [user.id] } },
//     });

//     expect(response.calls).toBeDefined();
//   });

//   afterEach(() => {
//     client.disconnectUser();
//   });
// });
