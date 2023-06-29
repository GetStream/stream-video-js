import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dispatcher } from '../Dispatcher';
import { StreamSfuClient } from '../../StreamSfuClient';
import { Subscriber } from '../Subscriber';
import { CallState } from '../../store';

vi.mock('../../StreamSfuClient', () => {
  console.log('MOCKING StreamSfuClient');
  return {
    StreamSfuClient: vi.fn(),
  };
});

describe('Subscriber', () => {
  let sfuClient: StreamSfuClient;
  let subscriber: Subscriber;
  let state = new CallState();

  beforeEach(() => {
    const dispatcher = new Dispatcher();
    sfuClient = new StreamSfuClient({
      dispatcher,
      sfuServer: {
        url: 'https://getstream.io/',
        ws_endpoint: 'https://getstream.io/ws',
        edge_name: 'sfu-1',
      },
      token: 'token',
    });

    subscriber = new Subscriber({
      sfuClient,
      dispatcher,
      state,
      connectionConfig: { iceServers: [] },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('Subscriber migration', () => {
    it('should update the sfuClient and create a new peer connection', async () => {
      const newSfuClient = new StreamSfuClient({
        dispatcher: new Dispatcher(),
        sfuServer: {
          url: 'https://getstream.io/',
          ws_endpoint: 'https://getstream.io/ws',
          edge_name: 'sfu-1',
        },
        token: 'token',
      });
      const newConnectionConfig = { iceServers: [] };

      const oldPeerConnection = subscriber['pc'];
      vi.spyOn(oldPeerConnection, 'getReceivers').mockReturnValue([]);

      await subscriber.migrateTo(newSfuClient, newConnectionConfig);
      const newPeerConnection = subscriber['pc'];

      expect(subscriber['sfuClient']).toBe(newSfuClient);
      expect(newPeerConnection).not.toBe(oldPeerConnection);
    });

    it('should close the old peer connection once the new one connects', async () => {
      let onConnectionStateChange: () => void = () => {};
      let onTrack: (e: RTCTrackEvent) => void = () => {};
      // @ts-ignore
      vi.spyOn(subscriber, 'createPeerConnection').mockImplementation(() => {
        const pc = new RTCPeerConnection();
        vi.spyOn(pc, 'addEventListener').mockImplementation((event, cb) => {
          if (event === 'connectionstatechange') {
            // @ts-ignore
            onConnectionStateChange = cb;
          } else if (event === 'track') {
            // @ts-ignore
            onTrack = cb;
          }
        });
        return pc;
      });

      const oldPeerConnection = subscriber['pc'];
      vi.spyOn(oldPeerConnection, 'getReceivers').mockReturnValue([]);
      vi.spyOn(oldPeerConnection, 'close');

      await subscriber.migrateTo(sfuClient, { iceServers: [] });

      const newPeerConnection = subscriber['pc'];
      vi.spyOn(newPeerConnection, 'removeEventListener');
      // @ts-ignore
      newPeerConnection.connectionState = 'connected';

      expect(onConnectionStateChange).toBeDefined();
      expect(oldPeerConnection.close).not.toHaveBeenCalled();
      onConnectionStateChange();

      // @ts-ignore
      onTrack(
        // @ts-ignore
        new RTCTrackEvent('video', {
          track: new MediaStreamTrack(),
        }),
      );

      expect(newPeerConnection.removeEventListener).toHaveBeenCalledWith(
        'connectionstatechange',
        onConnectionStateChange,
      );
      expect(newPeerConnection.removeEventListener).toHaveBeenCalledWith(
        'track',
        onTrack,
      );
      expect(oldPeerConnection.close).toHaveBeenCalled();
    });
  });
});
