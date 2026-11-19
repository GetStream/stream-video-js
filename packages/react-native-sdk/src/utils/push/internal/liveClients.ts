import {
  type Call,
  CallingState,
  type StreamVideoClient,
} from '@stream-io/video-client';

/**
 * The clients the SDK knows are running: the one given to `<StreamVideo>`, and the ones the push
 * handlers create. A notification action looks its call up here, so it can act on the call right
 * away instead of first creating a client, which goes over the network.
 */
const liveClients = new Set<StreamVideoClient>();

/**
 * Remembers `client`, so notification actions can reach its calls.
 *
 * @returns a function that forgets it again.
 */
export const registerLiveClient = (client: StreamVideoClient) => {
  liveClients.add(client);
  return () => {
    liveClients.delete(client);
  };
};

/**
 * The call with `callCid` in one of the running clients, unless it has already been left.
 * Synchronous: it only reads the clients' state.
 */
export const findLiveCall = (callCid: string): Call | undefined => {
  for (const client of liveClients) {
    const call = client.state.calls.find(
      (c) => c.cid === callCid && c.state.callingState !== CallingState.LEFT,
    );
    if (call) {
      return call;
    }
  }
  return undefined;
};
