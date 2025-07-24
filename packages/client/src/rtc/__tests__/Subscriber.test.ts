import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DispatchableMessage, Dispatcher } from '../Dispatcher';
import { StreamSfuClient } from '../../StreamSfuClient';
import { Subscriber } from '../Subscriber';
import { CallState } from '../../store';
import { SfuEvent, SubscriberOffer } from '../../gen/video/sfu/event/events';
import { ICERestartResponse } from '../../gen/video/sfu/signal_rpc/signal';
import {
  ErrorCode,
  PeerType,
  TrackType,
} from '../../gen/video/sfu/models/models';
import { NegotiationError } from '../NegotiationError';
import { IceTrickleBuffer } from '../IceTrickleBuffer';
import { StreamClient } from '../../coordinator/connection/client';

vi.mock('../../StreamSfuClient', () => {
  console.log('MOCKING StreamSfuClient');
  return {
    StreamSfuClient: vi.fn(),
  };
});

describe('Subscriber', () => {
  let sfuClient: StreamSfuClient;
  let subscriber: Subscriber;
  const state = new CallState();
  let dispatcher: Dispatcher;

  beforeEach(() => {
    dispatcher = new Dispatcher();
    sfuClient = new StreamSfuClient({
      dispatcher,
      sessionId: 'sessionId',
      streamClient: new StreamClient('abc'),
      cid: 'test:123',
      tag: 'logTag',
      credentials: {
        server: {
          url: 'https://getstream.io/',
          ws_endpoint: 'https://getstream.io/ws',
          edge_name: 'sfu-1',
        },
        token: 'token',
        ice_servers: [],
      },
      enableTracing: true,
    });
    // @ts-expect-error readonly field
    sfuClient.iceTrickleBuffer = new IceTrickleBuffer();

    subscriber = new Subscriber({
      sfuClient,
      dispatcher,
      state,
      connectionConfig: { iceServers: [] },
      tag: 'test',
      enableTracing: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    subscriber.dispose();
  });

  describe('Subscriber ICE restart', () => {
    it(`should drop consequent ICE restart requests`, async () => {
      sfuClient.iceRestart = vi.fn();
      // @ts-expect-error - private field
      subscriber['pc'].signalingState = 'have-remote-offer';

      await subscriber.restartIce();
      expect(sfuClient.iceRestart).not.toHaveBeenCalled();
    });

    it('should skip ICE restart when connection is still new', async () => {
      sfuClient.iceRestart = vi.fn();
      // @ts-expect-error - private field
      subscriber['pc'].connectionState = 'new';

      await subscriber.restartIce();
      expect(sfuClient.iceRestart).not.toHaveBeenCalled();
    });

    it('should ask the SFU for ICE restart', async () => {
      sfuClient.iceRestart = vi.fn().mockResolvedValue({ response: {} });
      // @ts-expect-error - private field
      subscriber['pc'].connectionState = 'connected';

      await subscriber.restartIce();
      expect(sfuClient.iceRestart).toHaveBeenCalledWith({
        peerType: PeerType.SUBSCRIBER,
      });
    });

    it(`should perform ICE restart when connection state changes to 'failed'`, () => {
      vi.spyOn(subscriber, 'restartIce').mockResolvedValue();
      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'failed';
      subscriber['onIceConnectionStateChange']();
      expect(subscriber['restartIce']).toHaveBeenCalled();
    });

    it(`should perform ICE restart when connection state changes to 'disconnected'`, () => {
      vi.spyOn(subscriber, 'restartIce').mockResolvedValue();
      vi.useFakeTimers();
      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'disconnected';
      subscriber['onIceConnectionStateChange']();
      vi.runOnlyPendingTimers();
      expect(subscriber.restartIce).toHaveBeenCalled();
    });

    it(`should throw NegotiationError when SFU returns an error`, async () => {
      sfuClient.iceRestart = vi.fn().mockResolvedValue({
        response: {
          error: {
            code: ErrorCode.PARTICIPANT_SIGNAL_LOST,
            message: 'Signal lost',
          },
        } as ICERestartResponse,
      });

      // @ts-expect-error - private field
      subscriber['pc'].connectionState = 'connected';

      await expect(subscriber.restartIce()).rejects.toThrowError(
        NegotiationError,
      );
      expect(sfuClient.iceRestart).toHaveBeenCalledWith({
        peerType: PeerType.SUBSCRIBER,
      });
    });
  });

  describe('OnTrack', () => {
    it('should add unknown tracks to the to the call state', () => {
      const mediaStream = new MediaStream();
      const mediaStreamTrack = new MediaStreamTrack();
      // @ts-expect-error - mock
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
      // @ts-expect-error - mock
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

    it('should replace participant stream when a new one arrives', () => {
      const mediaStream = new MediaStream();
      const mediaStreamTrack = new MediaStreamTrack();
      // @ts-expect-error - mock
      mediaStream.id = '123:TRACK_TYPE_VIDEO';

      const updateParticipantSpy = vi.spyOn(state, 'updateParticipant');

      const baseStream = new MediaStream();
      const baseTrack = new MediaStreamTrack();
      vi.spyOn(baseStream, 'getTracks').mockReturnValue([baseTrack]);
      // @ts-expect-error - incomplete mock
      state.updateOrAddParticipant('session-id', {
        sessionId: 'session-id',
        trackLookupPrefix: '123',
        videoStream: baseStream,
      });

      const onTrack = subscriber['handleOnTrack'];
      // @ts-expect-error - incomplete mock
      onTrack({ streams: [mediaStream], track: mediaStreamTrack });

      expect(updateParticipantSpy).toHaveBeenCalledWith('session-id', {
        videoStream: mediaStream,
      });
      expect(baseStream.getTracks).toHaveBeenCalled();
      expect(baseTrack.stop).toHaveBeenCalled();
      expect(baseStream.removeTrack).toHaveBeenCalledWith(baseTrack);
    });
  });

  describe('Negotiation', () => {
    it('negotiates with the SFU', async () => {
      sfuClient.sendAnswer = vi.fn();
      subscriber['pc'].createAnswer = vi
        .fn()
        .mockResolvedValue({ sdp: 'answer-sdp' });
      vi.spyOn(subscriber['pc'], 'setRemoteDescription').mockResolvedValue();

      const offer = SubscriberOffer.create({ sdp: 'offer-sdp' });
      // @ts-expect-error - private method
      await subscriber.negotiate(offer);
      expect(subscriber['pc'].setRemoteDescription).toHaveBeenCalledWith({
        type: 'offer',
        sdp: 'offer-sdp',
      });

      expect(subscriber['pc'].createAnswer).toHaveBeenCalled();
      expect(sfuClient.sendAnswer).toHaveBeenCalledWith({
        peerType: PeerType.SUBSCRIBER,
        sdp: 'answer-sdp',
      });
    });
  });

  describe('Event handling', () => {
    it('handles SubscriberOffer', async () => {
      // @ts-expect-error - private method
      subscriber.negotiate = vi.fn();
      const subscriberOffer = SubscriberOffer.create({
        sdp: 'offer-sdp',
        iceRestart: false,
      });
      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'subscriberOffer',
            subscriberOffer,
          },
        }) as DispatchableMessage<'subscriberOffer'>,
      );

      // @ts-expect-error - private method
      expect(subscriber.negotiate).toHaveBeenCalledWith(subscriberOffer);
    });
  });
});
