import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DispatchableMessage, Dispatcher } from '../Dispatcher';
import { StreamSfuClient } from '../../StreamSfuClient';
import { Subscriber } from '../Subscriber';
import { CallState } from '../../store';
import { SfuEvent } from '../../gen/video/sfu/event/events';
import { PeerType, TrackType } from '../../gen/video/sfu/models/models';
import { IceTrickleBuffer } from '../IceTrickleBuffer';

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
  let dispatcher: Dispatcher;

  beforeEach(() => {
    dispatcher = new Dispatcher();
    sfuClient = new StreamSfuClient({
      dispatcher,
      sessionId: 'sessionId',
      logTag: 'logTag',
      credentials: {
        server: {
          url: 'https://getstream.io/',
          ws_endpoint: 'https://getstream.io/ws',
          edge_name: 'sfu-1',
        },
        token: 'token',
        ice_servers: [],
      },
    });
    // @ts-expect-error readonly field
    sfuClient.iceTrickleBuffer = new IceTrickleBuffer();

    subscriber = new Subscriber({
      sfuClient,
      dispatcher,
      state,
      connectionConfig: { iceServers: [] },
      logTag: 'test',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    dispatcher.offAll();
  });

  describe('Subscriber ICE restart', () => {
    it('should perform ICE restart when iceRestart event is received', () => {
      sfuClient.iceRestart = vi.fn();
      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'iceRestart',
            iceRestart: {
              peerType: PeerType.SUBSCRIBER,
            },
          },
        }) as DispatchableMessage<'iceRestart'>,
      );

      expect(sfuClient.iceRestart).toHaveBeenCalledWith({
        peerType: PeerType.SUBSCRIBER,
      });
    });

    it('should not perform ICE restart when iceRestart event is received for a different peer type', () => {
      sfuClient.iceRestart = vi.fn();
      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'iceRestart',
            iceRestart: {
              peerType: PeerType.PUBLISHER_UNSPECIFIED,
            },
          },
        }) as DispatchableMessage<'iceRestart'>,
      );

      expect(sfuClient.iceRestart).not.toHaveBeenCalled();
    });

    it(`should drop consequent ICE restart requests`, async () => {
      sfuClient.iceRestart = vi.fn();
      // @ts-ignore
      subscriber['pc'].signalingState = 'have-remote-offer';

      await subscriber.restartIce();
      expect(sfuClient.iceRestart).not.toHaveBeenCalled();
    });

    it('should skip ICE restart when connection is still new', async () => {
      sfuClient.iceRestart = vi.fn();
      // @ts-ignore
      subscriber['pc'].connectionState = 'new';

      await subscriber.restartIce();
      expect(sfuClient.iceRestart).not.toHaveBeenCalled();
    });

    it(`should perform ICE restart when connection state changes to 'failed'`, () => {
      vi.spyOn(subscriber, 'restartIce').mockResolvedValue();
      // @ts-ignore
      subscriber['pc'].iceConnectionState = 'failed';
      subscriber['onIceConnectionStateChange']();
      expect(subscriber.restartIce).toHaveBeenCalled();
    });

    it(`should perform ICE restart when connection state changes to 'disconnected'`, () => {
      vi.spyOn(subscriber, 'restartIce').mockResolvedValue();
      // @ts-ignore
      subscriber['pc'].iceConnectionState = 'disconnected';
      subscriber['onIceConnectionStateChange']();
      expect(subscriber.restartIce).toHaveBeenCalled();
    });
  });

  describe('OnTrack', () => {
    it('should add unknown tracks to the to the call state', () => {
      const mediaStream = new MediaStream();
      const mediaStreamTrack = new MediaStreamTrack();
      // @ts-ignore - mock
      mediaStream.id = '123:TRACK_TYPE_VIDEO';

      const registerOrphanedTrackSpy = vi.spyOn(state, 'registerOrphanedTrack');
      const updateParticipantSpy = vi.spyOn(state, 'updateParticipant');

      const onTrack = subscriber['handleOnTrack'];
      // @ts-expect-error - incomplete mock
      onTrack({ streams: [mediaStream], track: mediaStreamTrack });

      expect(registerOrphanedTrackSpy).toHaveBeenCalledWith({
        id: mediaStream.id,
        trackLookupPrefix: '123',
        track: mediaStream,
        trackType: TrackType.VIDEO,
      });
      expect(updateParticipantSpy).not.toHaveBeenCalled();
    });

    it('should assign known tracks to the participant', () => {
      const mediaStream = new MediaStream();
      const mediaStreamTrack = new MediaStreamTrack();
      // @ts-ignore - mock
      mediaStream.id = '123:TRACK_TYPE_VIDEO';

      const registerOrphanedTrackSpy = vi.spyOn(state, 'registerOrphanedTrack');
      const updateParticipantSpy = vi.spyOn(state, 'updateParticipant');

      // @ts-expect-error - incomplete mock
      state.updateOrAddParticipant('session-id', {
        sessionId: 'session-id',
        trackLookupPrefix: '123',
      });

      const onTrack = subscriber['handleOnTrack'];
      // @ts-expect-error - incomplete mock
      onTrack({ streams: [mediaStream], track: mediaStreamTrack });

      expect(registerOrphanedTrackSpy).not.toHaveBeenCalled();
      expect(updateParticipantSpy).toHaveBeenCalledWith('session-id', {
        videoStream: mediaStream,
      });
    });
  });
});
