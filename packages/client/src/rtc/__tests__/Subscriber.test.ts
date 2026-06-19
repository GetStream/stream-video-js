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
  WebsocketReconnectStrategy,
} from '../../gen/video/sfu/models/models';
import { NegotiationError } from '../NegotiationError';
import { ReconnectReason } from '../types';
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
  let state: CallState;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    state = new CallState();
    dispatcher = new Dispatcher();
    sfuClient = new StreamSfuClient({
      dispatcher,
      sessionId: 'sessionId',
      streamClient: new StreamClient('abc'),
      cid: 'test:123',
      tag: 'test',
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

  afterEach(async () => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.resetModules();
    await subscriber.dispose();
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

    const simulatePriorIceConnected = () => {
      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'connected';
      subscriber['onIceConnectionStateChange']();
    };

    it(`should perform ICE restart when connection state changes to 'failed'`, () => {
      simulatePriorIceConnected();
      vi.spyOn(subscriber, 'restartIce').mockResolvedValue();
      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'failed';
      subscriber['onIceConnectionStateChange']();
      expect(subscriber['restartIce']).toHaveBeenCalled();
    });

    it(`should perform ICE restart when connection state changes to 'disconnected'`, () => {
      simulatePriorIceConnected();
      vi.spyOn(subscriber, 'restartIce').mockResolvedValue();
      vi.useFakeTimers();
      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'disconnected';
      subscriber['onIceConnectionStateChange']();
      vi.runOnlyPendingTimers();
      expect(subscriber.restartIce).toHaveBeenCalled();
    });

    it(`does NOT perform ICE restart when ICE never connected and state goes to 'failed' — emits REJOIN with 'ice_never_connected'`, () => {
      vi.spyOn(subscriber, 'restartIce').mockResolvedValue();
      subscriber['onReconnectionNeeded'] = vi.fn();
      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'failed';
      subscriber['onIceConnectionStateChange']();
      expect(subscriber.restartIce).not.toHaveBeenCalled();
      expect(subscriber['onReconnectionNeeded']).toHaveBeenCalledWith(
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.ICE_NEVER_CONNECTED,
        PeerType.SUBSCRIBER,
      );
    });

    it(`isStable() returns true only when ICE is connected/completed and connectionState is connected`, () => {
      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'connected';
      // @ts-expect-error - private field
      subscriber['pc'].connectionState = 'connected';
      expect(subscriber.isStable()).toBe(true);

      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'completed';
      expect(subscriber.isStable()).toBe(true);

      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'disconnected';
      expect(subscriber.isStable()).toBe(false);

      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'new';
      expect(subscriber.isStable()).toBe(false);
    });

    it(`iceHasEverConnected tracks lifetime connectivity`, () => {
      expect(subscriber['iceHasEverConnected']).toBe(false);
      simulatePriorIceConnected();
      expect(subscriber['iceHasEverConnected']).toBe(true);
      // going disconnected does not reset the flag
      // @ts-expect-error - private field
      subscriber['pc'].iceConnectionState = 'disconnected';
      subscriber['onIceConnectionStateChange']();
      expect(subscriber['iceHasEverConnected']).toBe(true);
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

  describe('Subscriber negotiation', () => {
    const subscriberOffer: SubscriberOffer = {
      sdp: 'subscriber-offer-sdp',
      iceRestart: false,
      negotiationId: 10,
    };

    beforeEach(() => {
      sfuClient.sendAnswer = vi.fn().mockResolvedValue({ response: {} });
    });

    it('resets isIceRestarting once a negotiation completes', async () => {
      subscriber['isIceRestarting'] = true;

      await subscriber['negotiate'](subscriberOffer);

      expect(sfuClient.sendAnswer).toHaveBeenCalledWith({
        peerType: PeerType.SUBSCRIBER,
        sdp: '',
        negotiationId: 10,
      });
      expect(subscriber['isIceRestarting']).toBe(false);
    });

    it('resets isIceRestarting even when the negotiation fails', async () => {
      subscriber['isIceRestarting'] = true;
      sfuClient.sendAnswer = vi
        .fn()
        .mockRejectedValue(new Error('send answer failed'));

      await expect(subscriber['negotiate'](subscriberOffer)).rejects.toThrow(
        'send answer failed',
      );
      expect(subscriber['isIceRestarting']).toBe(false);
    });

    it('rolls back the remote description when a negotiation fails mid-offer', async () => {
      const setRemoteDescription = vi.fn().mockResolvedValue({});
      subscriber['pc'].setRemoteDescription = setRemoteDescription;
      // @ts-expect-error - readonly field
      subscriber['pc'].signalingState = 'have-remote-offer';
      sfuClient.sendAnswer = vi
        .fn()
        .mockRejectedValue(new Error('send answer failed'));

      await expect(subscriber['negotiate'](subscriberOffer)).rejects.toThrow(
        'send answer failed',
      );
      expect(setRemoteDescription).toHaveBeenCalledWith({ type: 'rollback' });
    });

    it('does not roll back when the peer connection never applied the offer', async () => {
      // signalingState stays 'stable' because setRemoteDescription rejected
      subscriber['pc'].setRemoteDescription = vi
        .fn()
        .mockRejectedValue(new Error('set remote description failed'));

      await expect(subscriber['negotiate'](subscriberOffer)).rejects.toThrow(
        'set remote description failed',
      );
      expect(subscriber['pc'].setRemoteDescription).not.toHaveBeenCalledWith({
        type: 'rollback',
      });
    });

    it('propagates the original error even when the rollback itself fails', async () => {
      subscriber['pc'].setRemoteDescription = vi
        .fn()
        .mockResolvedValueOnce({}) // applying the offer succeeds
        .mockRejectedValueOnce(new Error('rollback failed')); // rollback fails
      // @ts-expect-error - readonly field
      subscriber['pc'].signalingState = 'have-remote-offer';
      sfuClient.sendAnswer = vi
        .fn()
        .mockRejectedValue(new Error('send answer failed'));

      await expect(subscriber['negotiate'](subscriberOffer)).rejects.toThrow(
        'send answer failed',
      );
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

  describe('interruptedTracks', () => {
    const setup = ({ muted = false }: { muted?: boolean } = {}) => {
      const mediaStream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-expect-error - mock
      mediaStream.id = 'lookup:TRACK_TYPE_AUDIO';
      // @ts-expect-error - mock
      track.kind = 'audio';
      Object.defineProperty(track, 'muted', {
        configurable: true,
        get: () => muted,
      });
      // @ts-expect-error - incomplete mock
      state.updateOrAddParticipant('session-id', {
        sessionId: 'session-id',
        trackLookupPrefix: 'lookup',
      });

      const onTrack = subscriber['handleOnTrack'];
      // @ts-expect-error - incomplete mock
      onTrack({ streams: [mediaStream], track });

      const calls = (track.addEventListener as ReturnType<typeof vi.fn>).mock
        .calls;
      const handlers: Record<string, () => void> = {};
      for (const [event, handler] of calls) {
        handlers[event] = handler as () => void;
      }
      return { track, handlers };
    };

    const interruptedFor = (sessionId: string) =>
      state.participants.find((p) => p.sessionId === sessionId)
        ?.interruptedTracks ?? [];

    it('adds the track type when the mute handler fires', () => {
      const { handlers } = setup();
      expect(interruptedFor('session-id')).toEqual([]);

      handlers['mute']();

      expect(interruptedFor('session-id')).toEqual([TrackType.AUDIO]);
    });

    it('removes the track type when the unmute handler fires', () => {
      const { handlers } = setup();
      handlers['mute']();
      expect(interruptedFor('session-id')).toEqual([TrackType.AUDIO]);

      handlers['unmute']();

      expect(interruptedFor('session-id')).toEqual([]);
    });

    it('seeds the track type when the track arrives already muted', () => {
      setup({ muted: true });

      expect(interruptedFor('session-id')).toEqual([TrackType.AUDIO]);
    });

    it('clears the track type when the track ends', () => {
      const { handlers } = setup();
      handlers['mute']();
      expect(interruptedFor('session-id')).toEqual([TrackType.AUDIO]);

      handlers['ended']();

      expect(interruptedFor('session-id')).toEqual([]);
    });

    it('ignores non-audio remote tracks to avoid Dynascale false positives', () => {
      // Remote video track.muted is dominated by viewport-driven
      // SFU unsubscriptions, so we deliberately only track audio
      // interruption on remote participants.
      const mediaStream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-expect-error - mock
      mediaStream.id = 'video-lookup:TRACK_TYPE_VIDEO';
      // @ts-expect-error - mock
      track.kind = 'video';
      Object.defineProperty(track, 'muted', {
        configurable: true,
        get: () => true,
      });
      // @ts-expect-error - incomplete mock
      state.updateOrAddParticipant('video-session', {
        sessionId: 'video-session',
        trackLookupPrefix: 'video-lookup',
      });

      const onTrack = subscriber['handleOnTrack'];
      // @ts-expect-error - incomplete mock
      onTrack({ streams: [mediaStream], track });

      // Seeded muted track is ignored.
      expect(interruptedFor('video-session')).toEqual([]);

      // Subsequent mute / unmute events are ignored too.
      const calls = (track.addEventListener as ReturnType<typeof vi.fn>).mock
        .calls;
      const handlers: Record<string, () => void> = {};
      for (const [event, handler] of calls) {
        handlers[event] = handler as () => void;
      }
      handlers['mute']();
      handlers['unmute']();
      expect(interruptedFor('video-session')).toEqual([]);
    });

    it('does not mutate state for orphaned tracks until associated', () => {
      const mediaStream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-expect-error - mock
      mediaStream.id = 'orphan:TRACK_TYPE_AUDIO';
      // @ts-expect-error - mock
      track.kind = 'audio';

      const onTrack = subscriber['handleOnTrack'];
      // @ts-expect-error - incomplete mock
      onTrack({ streams: [mediaStream], track });

      const calls = (track.addEventListener as ReturnType<typeof vi.fn>).mock
        .calls;
      const handlers: Record<string, () => void> = {};
      for (const [event, handler] of calls) {
        handlers[event] = handler as () => void;
      }

      // Orphan: handler fires before the participant exists.
      handlers['mute']();
      expect(state.participants).toEqual([]);

      // Once the participant is registered, the next event lands.
      // @ts-expect-error - incomplete mock
      state.updateOrAddParticipant('orphan-session', {
        sessionId: 'orphan-session',
        trackLookupPrefix: 'orphan',
      });
      handlers['mute']();

      expect(interruptedFor('orphan-session')).toEqual([TrackType.AUDIO]);
    });
  });

  describe('Negotiation', () => {
    it('negotiates with the SFU', async () => {
      sfuClient.sendAnswer = vi.fn();
      subscriber['pc'].createAnswer = vi
        .fn()
        .mockResolvedValue({ sdp: 'answer-sdp' });
      vi.spyOn(subscriber['pc'], 'setRemoteDescription').mockResolvedValue();

      const offer = SubscriberOffer.create({
        sdp: 'offer-sdp',
        negotiationId: 42,
      });
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
        negotiationId: 42,
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
        'test',
      );

      // @ts-expect-error - private method
      expect(subscriber.negotiate).toHaveBeenCalledWith(subscriberOffer);
    });

    it('handles SubscriberOffer when SFU tag changes', () => {
      // @ts-expect-error - private method
      subscriber.negotiate = vi.fn();
      const subscriberOffer = SubscriberOffer.create({
        sdp: 'offer-sdp',
        iceRestart: true,
      });

      const nextSfuClient = {
        ...sfuClient,
        tag: 'next-tag',
      } as StreamSfuClient;
      subscriber.setSfuClient(nextSfuClient);

      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'subscriberOffer',
            subscriberOffer,
          },
        }) as DispatchableMessage<'subscriberOffer'>,
        'test',
      );
      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'subscriberOffer',
            subscriberOffer,
          },
        }) as DispatchableMessage<'subscriberOffer'>,
        'next-tag',
      );

      // @ts-expect-error - private method
      expect(subscriber.negotiate).toHaveBeenCalledTimes(1);
      // @ts-expect-error - private method
      expect(subscriber.negotiate).toHaveBeenCalledWith(subscriberOffer);
    });
  });
});
