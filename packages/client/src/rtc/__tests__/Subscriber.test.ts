import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dispatcher } from '../Dispatcher';
import { StreamSfuClient } from '../../StreamSfuClient';
import { Subscriber } from '../Subscriber';

vi.mock('../../StreamSfuClient', () => {
  console.log('MOCKING StreamSfuClient');
  return {
    StreamSfuClient: vi.fn(),
  };
});

describe('Subscriber', () => {
  let sfuClient: StreamSfuClient;
  let subscriber: Subscriber;
  const onTrack = vi.fn();

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
      connectionConfig: { iceServers: [] },
      onTrack,
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

      const oldPeerConnection = subscriber['subscriber'];
      await subscriber.migrateTo(newSfuClient, newConnectionConfig);
      const newPeerConnection = subscriber['subscriber'];

      expect(subscriber['sfuClient']).toBe(newSfuClient);
      expect(newPeerConnection).not.toBe(oldPeerConnection);
    });

    it('should close the old peer connection once the new one connects', async () => {
      let onConnectionStateChange: () => void = () => {};
      // @ts-ignore
      vi.spyOn(subscriber, 'createPeerConnection').mockImplementation(() => {
        const pc = new RTCPeerConnection();
        vi.spyOn(pc, 'addEventListener').mockImplementation((event, cb) => {
          if (event === 'connectionstatechange') {
            // @ts-ignore
            onConnectionStateChange = cb;
          }
        });
        return pc;
      });

      const oldPeerConnection = subscriber['subscriber'];
      vi.spyOn(oldPeerConnection, 'close');

      await subscriber.migrateTo(sfuClient, { iceServers: [] });

      const newPeerConnection = subscriber['subscriber'];
      // @ts-ignore
      newPeerConnection.connectionState = 'connected';

      expect(onConnectionStateChange).toBeDefined();
      expect(oldPeerConnection.close).not.toHaveBeenCalled();
      onConnectionStateChange();
      expect(oldPeerConnection.close).toHaveBeenCalled();
    });
  });
});
