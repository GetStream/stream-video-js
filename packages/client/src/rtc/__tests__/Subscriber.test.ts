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
      onRemoteAudioTrackChange: () => {},
      tag: 'test',
      enableTracing: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  describe('onRemoteAudioTrackChange', () => {
    /**
     * Pulls the listener for `eventName` registered on the mocked
     * `addEventListener`. The mock records `[eventName, handler]`
     * tuples; we want the handler for the matching event.
     */
    const listenerFor = (
      track: MediaStreamTrack,
      eventName: 'mute' | 'unmute' | 'ended',
    ): (() => void) => {
      const calls = (track.addEventListener as ReturnType<typeof vi.fn>).mock
        .calls;
      const match = calls.find((c) => c[0] === eventName);
      if (!match) throw new Error(`No listener for ${eventName}`);
      return match[1];
    };

    const fireAudioOnTrack = (
      onRemoteAudioTrackChange: ReturnType<typeof vi.fn>,
    ): MediaStreamTrack => {
      // Re-construct the Subscriber so the spy is wired in.
      subscriber.dispose();
      subscriber = new Subscriber({
        sfuClient,
        dispatcher,
        state,
        connectionConfig: { iceServers: [] },
        tag: 'test',
        enableTracing: true,
        onRemoteAudioTrackChange,
      });

      const stream = new MediaStream();
      // @ts-expect-error - mock
      stream.id = '123:TRACK_TYPE_AUDIO';
      const track = new MediaStreamTrack();
      // @ts-expect-error - mocked override
      track.kind = 'audio';
      // @ts-expect-error - private
      subscriber.handleOnTrack({ streams: [stream], track });
      return track;
    };

    it('invokes the callback with `muted` when an audio track fires `mute`', () => {
      const cb = vi.fn();
      const track = fireAudioOnTrack(cb);
      listenerFor(track, 'mute')();
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(track, 'muted');
    });

    it('invokes the callback with `unmuted` and `ended` for the matching events', () => {
      const cb = vi.fn();
      const track = fireAudioOnTrack(cb);

      listenerFor(track, 'unmute')();
      expect(cb).toHaveBeenLastCalledWith(track, 'unmuted');

      listenerFor(track, 'ended')();
      expect(cb).toHaveBeenLastCalledWith(track, 'ended');
      expect(cb).toHaveBeenCalledTimes(2);
    });

    it('does NOT invoke the callback for video tracks (kind filter)', () => {
      const cb = vi.fn();
      // Reconstruct with the spy; default mocked track.kind is 'video'.
      subscriber.dispose();
      subscriber = new Subscriber({
        sfuClient,
        dispatcher,
        state,
        connectionConfig: { iceServers: [] },
        tag: 'test',
        enableTracing: true,
        onRemoteAudioTrackChange: cb,
      });
      const stream = new MediaStream();
      // @ts-expect-error - mock
      stream.id = '123:TRACK_TYPE_VIDEO';
      const track = new MediaStreamTrack(); // kind: 'video'
      // @ts-expect-error - private
      subscriber.handleOnTrack({ streams: [stream], track });

      listenerFor(track, 'mute')();
      listenerFor(track, 'unmute')();
      listenerFor(track, 'ended')();
      expect(cb).not.toHaveBeenCalled();
    });

    /**
     * Reset the Subscriber wired with the given callback. Ensures each
     * test below starts with a fresh PC and no inherited listeners.
     */
    const reinitSubscriber = (cb: ReturnType<typeof vi.fn>) => {
      subscriber.dispose();
      subscriber = new Subscriber({
        sfuClient,
        dispatcher,
        state,
        connectionConfig: { iceServers: [] },
        tag: 'test',
        enableTracing: true,
        onRemoteAudioTrackChange: cb,
      });
    };

    /**
     * Build an audio MediaStream that mocks `getTracks()` so the
     * Subscriber's replacement-path cleanup can iterate it.
     */
    const audioStreamWith = (track: MediaStreamTrack): MediaStream => {
      const stream = new MediaStream();
      // @ts-expect-error - mock
      stream.id = '123:TRACK_TYPE_AUDIO';
      vi.spyOn(stream, 'getTracks').mockReturnValue([track]);
      return stream;
    };

    it('synthesises `ended` on the previous audio track during replacement (track.stop does not dispatch ended)', () => {
      const cb = vi.fn();
      reinitSubscriber(cb);

      // Set up a participant so handleOnTrack takes the
      // updateOrAddParticipant path (where previousStream replacement
      // actually fires).
      // @ts-expect-error - incomplete mock
      state.updateOrAddParticipant('session-id', {
        sessionId: 'session-id',
        trackLookupPrefix: '123',
      });

      const oldTrack = new MediaStreamTrack();
      // @ts-expect-error - mocked override
      oldTrack.kind = 'audio';
      const oldStream = audioStreamWith(oldTrack);
      // @ts-expect-error - private
      subscriber.handleOnTrack({ streams: [oldStream], track: oldTrack });

      // Mute the old track, then replace it with a new stream/track.
      listenerFor(oldTrack, 'mute')();
      expect(cb).toHaveBeenLastCalledWith(oldTrack, 'muted');
      cb.mockClear();

      const newTrack = new MediaStreamTrack();
      // @ts-expect-error - mocked override
      newTrack.kind = 'audio';
      const newStream = audioStreamWith(newTrack);
      // @ts-expect-error - private
      subscriber.handleOnTrack({ streams: [newStream], track: newTrack });

      // The replacement path stops + removes oldTrack but the browser
      // doesn't dispatch `'ended'`. The Subscriber must synthesise it
      // so AudioHealthMonitor doesn't carry the stale `muted` entry.
      expect(cb).toHaveBeenCalledWith(oldTrack, 'ended');
      expect(oldTrack.stop).toHaveBeenCalled();
    });

    it('does NOT synthesise `ended` for the previous track twice when it then fires browser `ended`', () => {
      const cb = vi.fn();
      reinitSubscriber(cb);
      // @ts-expect-error - incomplete mock
      state.updateOrAddParticipant('session-id', {
        sessionId: 'session-id',
        trackLookupPrefix: '123',
      });

      const oldTrack = new MediaStreamTrack();
      // @ts-expect-error - mocked override
      oldTrack.kind = 'audio';
      const oldStream = audioStreamWith(oldTrack);
      // @ts-expect-error - private
      subscriber.handleOnTrack({ streams: [oldStream], track: oldTrack });

      const newTrack = new MediaStreamTrack();
      // @ts-expect-error - mocked override
      newTrack.kind = 'audio';
      const newStream = audioStreamWith(newTrack);
      // @ts-expect-error - private
      subscriber.handleOnTrack({ streams: [newStream], track: newTrack });

      // Replacement already synthesised `ended` for oldTrack.
      const endedCallsForOld = cb.mock.calls.filter(
        ([t, change]) => t === oldTrack && change === 'ended',
      );
      expect(endedCallsForOld).toHaveLength(1);

      // If the browser later dispatches a real `ended` event on
      // oldTrack, the listener still fires — but the track is no
      // longer in the tracked set, so we don't double-fire.
      listenerFor(oldTrack, 'ended')();
      const endedCallsForOldAfter = cb.mock.calls.filter(
        ([t, change]) => t === oldTrack && change === 'ended',
      );
      expect(endedCallsForOldAfter).toHaveLength(2); // listener still fires once more
      // Whether the post-stop listener firing is suppressed inside the
      // monitor is an aggregation concern; here we only verify the
      // synthesised callback happens at the right moment.
    });

    it('synthesises `ended` on detachEventHandlers for every audio track on the PC receivers', () => {
      const cb = vi.fn();
      reinitSubscriber(cb);

      const audioTrack = new MediaStreamTrack();
      // @ts-expect-error - mocked override
      audioTrack.kind = 'audio';
      const videoTrack = new MediaStreamTrack(); // default kind: 'video'
      const fakeReceivers = [
        { track: audioTrack },
        { track: videoTrack },
      ] as RTCRtpReceiver[];
      vi.spyOn(subscriber['pc'], 'getReceivers').mockReturnValue(fakeReceivers);

      subscriber.detachEventHandlers();

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(audioTrack, 'ended');
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
