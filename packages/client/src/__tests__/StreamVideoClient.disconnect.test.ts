import '../rtc/__tests__/mocks/webrtc.mocks';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import { CallingState } from '../store';

const fakeCall = (cid: string, callingState: CallingState) => ({
  cid,
  state: { callingState },
  leave: vi.fn().mockResolvedValue(undefined),
  watching: false,
});

describe('disconnectUser leaves calls', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('closes the connection before native termination and awaits its completion', async () => {
    const client = new StreamVideoClient('abc');
    const order: string[] = [];
    const active = fakeCall('default:active', CallingState.JOINED);
    active.leave.mockImplementation(async () => {
      order.push('leave');
    });
    client.state.setCalls([active] as never);
    // @ts-expect-error faking the minimum the guard needs
    client.streamClient.user = { id: 'jane' };
    client.state.setConnectedUser({ id: 'jane' } as never);
    let finish!: () => void;
    const terminateClient = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          order.push('terminate');
          finish = resolve;
        }),
    );
    vi.stubGlobal('streamRNVideoSDK', { callingX: { terminateClient } });
    const disconnect = vi
      .spyOn(client.streamClient, 'disconnectUser')
      .mockImplementation(async () => {
        delete client.streamClient.user;
        order.push('disconnect');
      });
    const completed = vi.fn();
    const pending = client.disconnectUser().then(completed);
    await vi.waitFor(() => expect(terminateClient).toHaveBeenCalledTimes(1));
    try {
      expect(disconnect).toHaveBeenCalledOnce();
      expect(order).toEqual(['leave', 'disconnect', 'terminate']);
      expect(client.state.connectedUser).toBeUndefined();
      expect(completed).not.toHaveBeenCalled();
    } finally {
      finish();
      await pending;
    }
    expect(completed).toHaveBeenCalledOnce();
    await client.disconnectUser();
    expect(terminateClient).toHaveBeenCalledTimes(1);
  });

  it('still disconnects and clears state if native termination rejects', async () => {
    const client = new StreamVideoClient('abc');
    // @ts-expect-error faking the minimum the guard needs
    client.streamClient.user = { id: 'jane' };
    client.state.setConnectedUser({ id: 'jane' } as never);
    vi.stubGlobal('streamRNVideoSDK', {
      callingX: {
        terminateClient: vi.fn().mockRejectedValue(new Error('native failure')),
      },
    });
    const disconnect = vi
      .spyOn(client.streamClient, 'disconnectUser')
      .mockResolvedValue(undefined as never);
    await expect(client.disconnectUser()).resolves.toBeUndefined();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(client.state.connectedUser).toBeUndefined();
  });
  it('leaves non-LEFT calls, before closing the connection', async () => {
    const client = new StreamVideoClient('abc');
    const order: string[] = [];

    const active = fakeCall('default:active', CallingState.JOINED);
    const left = fakeCall('default:left', CallingState.LEFT);
    active.leave.mockImplementation(async () => {
      order.push('leave:active');
    });
    left.leave.mockImplementation(async () => {
      order.push('leave:left');
    });

    client.state.setCalls([active, left] as never);

    // @ts-expect-error faking the minimum the guard needs
    client.streamClient.user = { id: 'jane' };
    vi.spyOn(client.streamClient, 'disconnectUser').mockImplementation(
      async () => {
        order.push('ws:close');
      },
    );

    await client.disconnectUser();

    expect(active.leave).toHaveBeenCalledWith({
      message: 'client.disconnectUser() called',
    });
    expect(left.leave).not.toHaveBeenCalled();
    expect(order).toEqual(['leave:active', 'ws:close']);
    expect(client.state.connectedUser).toBeUndefined();
  });

  it('a failing leave does not block the disconnect', async () => {
    const client = new StreamVideoClient('abc');
    const boom = fakeCall('default:boom', CallingState.JOINED);
    boom.leave.mockRejectedValue(new Error('nope'));
    client.state.setCalls([boom] as never);

    // @ts-expect-error faking the minimum the guard needs
    client.streamClient.user = { id: 'jane' };
    vi.spyOn(client.streamClient, 'disconnectUser').mockResolvedValue(
      undefined as never,
    );

    await expect(client.disconnectUser()).resolves.toBeUndefined();
    expect(boom.leave).toHaveBeenCalled();
  });
});
