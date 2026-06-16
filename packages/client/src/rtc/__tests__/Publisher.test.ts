import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { anyString } from 'vitest-mock-extended';
import { fromPartial } from '@total-typescript/shoehorn';
import { NegotiationError } from '../NegotiationError';
import { Publisher } from '../Publisher';
import { ReconnectReason } from '../types';
import { CallState } from '../../store';
import { StreamSfuClient } from '../../StreamSfuClient';
import { DispatchableMessage, Dispatcher } from '../Dispatcher';
import {
  DegradationPreference,
  ErrorCode,
  PeerType,
  PublishOption,
  TrackInfo,
  TrackType,
  WebsocketReconnectStrategy,
} from '../../gen/video/sfu/models/models';
import { SetPublisherResponse } from '../../gen/video/sfu/signal_rpc/signal';
import { SfuEvent } from '../../gen/video/sfu/event/events';
import { IceTrickleBuffer } from '../IceTrickleBuffer';
import { StreamClient } from '../../coordinator/connection/client';
import { TransceiverCache } from '../TransceiverCache';
import { promiseWithResolvers } from '../../helpers/promise';
import { isFirefox } from '../../helpers/browsers';

vi.mock('../../StreamSfuClient', () => {
  console.log('MOCKING StreamSfuClient');
  return {
    StreamSfuClient: vi.fn(),
  };
});

vi.mock('../../helpers/browsers', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../helpers/browsers')>();
  return { ...actual, isFirefox: vi.fn().mockReturnValue(false) };
});

describe('Publisher', () => {
  const sessionId = 'session-id-test';
  let publisher: Publisher;
  let sfuClient: StreamSfuClient;
  let state: CallState;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    dispatcher = new Dispatcher();
    sfuClient = new StreamSfuClient({
      dispatcher,
      sessionId: 'session-id-test',
      streamClient: new StreamClient('abc'),
      cid: 'test:123',
      credentials: {
        server: {
          url: 'https://getstream.io/',
          ws_endpoint: 'https://getstream.io/ws',
          edge_name: 'sfu-1',
        },
        token: 'token',
        ice_servers: [],
      },
      tag: 'test',
      enableTracing: true,
    });

    // @ts-expect-error readonly field
    sfuClient.iceTrickleBuffer = new IceTrickleBuffer();

    // @ts-expect-error private field
    sfuClient['sessionId'] = sessionId;

    state = new CallState();
    publisher = new Publisher(
      {
        sfuClient,
        dispatcher,
        state,
        tag: 'test',
        enableTracing: false,
      },
      [
        {
          id: 1,
          trackType: TrackType.VIDEO,
          bitrate: 1000,
          // @ts-expect-error - incomplete data
          codec: { name: 'vp9' },
          fps: 30,
          maxTemporalLayers: 3,
          maxSpatialLayers: 3,
          degradationPreference: DegradationPreference.UNSPECIFIED,
        },
      ],
    );
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.resetModules();
    await publisher.dispose();
  });

  describe('Publishing', () => {
    it('should throw when publishing ended tracks', async () => {
      const track = new MediaStreamTrack();
      // @ts-expect-error readonly field
      track.readyState = 'ended';
      await expect(publisher.publish(track, TrackType.VIDEO)).rejects.toThrow();
    });

    it('should throw when attempting to publish a track that has no publish options', async () => {
      const track = new MediaStreamTrack();
      await expect(publisher.publish(track, TrackType.AUDIO)).rejects.toThrow();
    });

    it('should add a transceiver for new tracks', async () => {
      const track = new MediaStreamTrack();
      const clone = new MediaStreamTrack();
      vi.spyOn(track, 'clone').mockReturnValue(clone);
      // @ts-expect-error - private method
      const negotiateSpy = vi.spyOn(publisher, 'negotiate').mockResolvedValue();

      await publisher.publish(track, TrackType.VIDEO);

      expect(track.clone).toHaveBeenCalled();
      expect(publisher['pc'].addTransceiver).toHaveBeenCalledWith(clone, {
        direction: 'sendonly',
        sendEncodings: [
          {
            rid: 'q',
            active: true,
            maxBitrate: 1000,
            height: 720,
            width: 1280,
            maxFramerate: 30,
            scalabilityMode: 'L3T3_KEY',
          },
        ],
      });
      expect(publisher['clonedTracks'].size).toBe(1);
      expect(negotiateSpy).toHaveBeenCalled();
    });

    it('should update an existing transceiver for a new track', async () => {
      const track = new MediaStreamTrack();
      const clone = new MediaStreamTrack();
      vi.spyOn(track, 'clone').mockReturnValue(clone);

      const transceiver = new RTCRtpTransceiver();
      // @ts-expect-error test setup
      transceiver.sender.track = track;
      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver,
        options: {},
      });

      await publisher.publish(track, TrackType.VIDEO);

      expect(track.clone).toHaveBeenCalled();
      expect(publisher['pc'].addTransceiver).not.toHaveBeenCalled();
      expect(transceiver.sender.replaceTrack).toHaveBeenCalledWith(clone);
      expect(track.stop).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('handles changePublishQuality events', () => {
      publisher['changePublishQuality'] = vi.fn();
      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'changePublishQuality',
            changePublishQuality: {
              audioSenders: [],
              videoSenders: [
                fromPartial({
                  publishOptionId: 1,
                  trackType: TrackType.VIDEO,
                  layers: [],
                  degradationPreference: DegradationPreference.BALANCED,
                }),
                fromPartial({
                  publishOptionId: 2,
                  trackType: TrackType.SCREEN_SHARE,
                  layers: [],
                  degradationPreference:
                    DegradationPreference.MAINTAIN_RESOLUTION,
                }),
              ],
            },
          },
        }) as DispatchableMessage<'changePublishQuality'>,
        'test',
      );
      expect(publisher['changePublishQuality']).toHaveBeenCalled();
    });

    it('handles changePublishOptions events', () => {
      publisher['syncPublishOptions'] = vi.fn();
      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'changePublishOptions',
            changePublishOptions: { publishOptions: [], reason: 'test' },
          },
        }) as DispatchableMessage<'changePublishOptions'>,
        'test',
      );
      expect(publisher['syncPublishOptions']).toHaveBeenCalled();
    });
  });

  describe('Publisher ICE Restart', () => {
    it('should perform ICE restart when iceRestart event is received', () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'iceRestart',
            iceRestart: {
              peerType: PeerType.PUBLISHER_UNSPECIFIED,
            },
          },
        }) as DispatchableMessage<'iceRestart'>,
        'test',
      );
      expect(publisher.restartIce).toHaveBeenCalled();
    });

    it('should not perform ICE restart when iceRestart event is received for a different peer type', () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
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
      expect(publisher.restartIce).not.toHaveBeenCalled();
    });

    it(`should drop consequent ICE restart requests`, async () => {
      // @ts-expect-error private method
      publisher['pc'].signalingState = 'have-local-offer';
      // @ts-expect-error private method
      vi.spyOn(publisher, 'negotiate').mockResolvedValue();

      await publisher.restartIce();
      expect(publisher['negotiate']).not.toHaveBeenCalled();
    });

    it('should initiate new negotiation when ICE restart is requested', async () => {
      // @ts-expect-error private method
      vi.spyOn(publisher, 'negotiate').mockResolvedValue();

      await publisher.restartIce();
      expect(publisher['negotiate']).toHaveBeenCalled();
    });

    const simulatePriorIceConnected = () => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();
    };

    it(`should perform ICE restart when connection state changes to 'failed'`, () => {
      simulatePriorIceConnected();
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();
      expect(publisher.restartIce).toHaveBeenCalled();
    });

    it(`should perform rejoin when ICE restart fails after connection state changes to 'failed'`, async () => {
      simulatePriorIceConnected();
      const { promise: lock, resolve: unlock } = promiseWithResolvers<void>();
      publisher['onReconnectionNeeded'] = vi
        .fn()
        .mockImplementation(() => unlock());
      vi.spyOn(publisher, 'restartIce').mockRejectedValue('ICE restart failed');
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();

      await lock;
      expect(publisher.restartIce).toHaveBeenCalled();
      expect(publisher['onReconnectionNeeded']).toHaveBeenCalled();
    });

    it(`should perform fast reconnect when ICE restart fails with SIGNAL_LOST error`, async () => {
      simulatePriorIceConnected();
      const { promise: lock, resolve: unlock } = promiseWithResolvers<void>();
      publisher['onReconnectionNeeded'] = vi
        .fn()
        .mockImplementation(() => unlock());
      publisher.getAnnouncedTracks = vi
        .fn()
        .mockReturnValue([
          { trackId: '123', trackType: TrackType.VIDEO, mid: '0' },
        ]);

      // @ts-expect-error private api
      vi.spyOn(publisher, 'negotiate');
      vi.spyOn(publisher, 'restartIce');

      const pc = publisher['pc'];

      sfuClient.setPublisher = vi.fn().mockImplementation(() => {
        // @ts-expect-error private api
        pc.signalingState = 'have-local-offer';
        return {
          response: {
            error: {
              code: ErrorCode.PARTICIPANT_SIGNAL_LOST,
              message: 'Signal lost',
              shouldRetry: true,
            },
          } as SetPublisherResponse,
        };
      });

      // @ts-expect-error private api
      pc.iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();

      await lock;
      expect(publisher.restartIce).toHaveBeenCalled();
      expect(publisher['negotiate']).toHaveBeenCalled();
      expect(publisher['onReconnectionNeeded']).toHaveBeenCalledWith(
        WebsocketReconnectStrategy.FAST,
        anyString(),
        PeerType.PUBLISHER_UNSPECIFIED,
      );

      expect(pc.setLocalDescription).toHaveBeenCalledTimes(2);
      expect(pc.setLocalDescription).toHaveBeenLastCalledWith({
        type: 'rollback',
      });
      expect(pc.setRemoteDescription).not.toHaveBeenCalled();
    });

    it(`should perform REJOIN reconnect when ICE restart fails with any other error code`, async () => {
      simulatePriorIceConnected();
      const { promise: lock, resolve: unlock } = promiseWithResolvers<void>();
      publisher['onReconnectionNeeded'] = vi
        .fn()
        .mockImplementation(() => unlock());
      publisher.getAnnouncedTracks = vi
        .fn()
        .mockReturnValue([
          { trackId: '123', trackType: TrackType.VIDEO, mid: '0' },
        ]);

      // @ts-expect-error private api
      vi.spyOn(publisher, 'negotiate');
      vi.spyOn(publisher, 'restartIce');

      sfuClient.setPublisher = vi.fn().mockResolvedValue({
        response: {
          error: {
            code: ErrorCode.PARTICIPANT_NOT_FOUND,
            message: 'participant not found',
            shouldRetry: true,
          },
        } as SetPublisherResponse,
      });

      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();

      await lock;
      expect(publisher.restartIce).toHaveBeenCalled();
      expect(publisher['negotiate']).toHaveBeenCalled();
      await expect(publisher.restartIce).rejects.toThrowError(NegotiationError);
      expect(publisher['onReconnectionNeeded']).toHaveBeenCalledWith(
        WebsocketReconnectStrategy.REJOIN,
        anyString(),
        PeerType.PUBLISHER_UNSPECIFIED,
      );
    });

    it(`should schedule ICE restart when connection state changes to 'disconnected'`, () => {
      simulatePriorIceConnected();
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      vi.useFakeTimers();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();

      vi.runOnlyPendingTimers();
      expect(publisher.restartIce).toHaveBeenCalled();
    });

    it(`should perform rejoin when scheduled ICE restart fails`, async () => {
      simulatePriorIceConnected();
      vi.spyOn(publisher, 'restartIce').mockRejectedValue('ICE restart failed');
      const { promise: lock, resolve } = promiseWithResolvers<void>();
      publisher['onReconnectionNeeded'] = vi
        .fn()
        .mockImplementation(() => resolve());
      vi.useFakeTimers();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();

      vi.runOnlyPendingTimers();

      await lock;
      expect(publisher.restartIce).toHaveBeenCalled();
      expect(publisher['onReconnectionNeeded']).toHaveBeenCalled();
    });

    it(`iceHasEverConnected is false before any connected state is observed`, () => {
      expect(publisher['iceHasEverConnected']).toBe(false);
    });

    it(`iceHasEverConnected becomes true after 'connected' ICE state`, () => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();
      expect(publisher['iceHasEverConnected']).toBe(true);
    });

    it(`iceHasEverConnected also flips on 'completed' ICE state`, () => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'completed';
      publisher['onIceConnectionStateChange']();
      expect(publisher['iceHasEverConnected']).toBe(true);
    });

    it(`does NOT call restartIce when ICE never connected and state goes to 'failed' — emits REJOIN with 'ice_never_connected'`, () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      publisher['onReconnectionNeeded'] = vi.fn();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();
      expect(publisher.restartIce).not.toHaveBeenCalled();
      expect(publisher['onReconnectionNeeded']).toHaveBeenCalledWith(
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.ICE_NEVER_CONNECTED,
        PeerType.PUBLISHER_UNSPECIFIED,
      );
    });

    it(`pre-connect 'disconnected' does not restart or escalate immediately`, () => {
      // ICE has never reached `connected`. A `disconnected` transition at
      // this point is just the browser's checking phase wobbling; the
      // browser may yet move back to checking/connected. The SDK should
      // wait it out — no synchronous restart, no synchronous REJOIN. Only
      // a terminal `failed` before connect, or the pre-connect watchdog
      // expiring, should escalate via `ICE_NEVER_CONNECTED`.
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      publisher['onReconnectionNeeded'] = vi.fn();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();
      expect(publisher.restartIce).not.toHaveBeenCalled();
      expect(publisher['onReconnectionNeeded']).not.toHaveBeenCalled();
    });

    it(`pre-connect 'disconnected' watchdog escalates to REJOIN if state stays stuck`, () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      publisher['onReconnectionNeeded'] = vi.fn();
      vi.useFakeTimers();
      const watchdogMs = publisher['iceRestartDelay'] * 2;

      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();
      // before the watchdog fires, no escalation
      vi.advanceTimersByTime(watchdogMs - 1);
      expect(publisher['onReconnectionNeeded']).not.toHaveBeenCalled();

      // watchdog fires; still stuck in disconnected → escalate
      vi.advanceTimersByTime(2);
      expect(publisher.restartIce).not.toHaveBeenCalled();
      expect(publisher['onReconnectionNeeded']).toHaveBeenCalledWith(
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.ICE_NEVER_CONNECTED,
        PeerType.PUBLISHER_UNSPECIFIED,
      );
    });

    it(`pre-connect 'disconnected' watchdog is canceled when ICE recovers to 'connected'`, () => {
      publisher['onReconnectionNeeded'] = vi.fn();
      vi.useFakeTimers();
      const watchdogMs = publisher['iceRestartDelay'] * 2;

      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();
      // recover before the watchdog window expires
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();

      // advance past the original watchdog window — must NOT fire now
      vi.advanceTimersByTime(watchdogMs + 100);

      expect(publisher['iceHasEverConnected']).toBe(true);
      expect(publisher['onReconnectionNeeded']).not.toHaveBeenCalled();
    });

    it(`pre-connect 'disconnected' that recovers to 'connected' continues normally`, () => {
      publisher['onReconnectionNeeded'] = vi.fn();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();
      // browser now reaches connected — the normal connected branch runs
      // and `iceHasEverConnected` flips to true.
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();
      expect(publisher['iceHasEverConnected']).toBe(true);
      expect(publisher['onReconnectionNeeded']).not.toHaveBeenCalled();
    });

    it(`isStable() returns false when ICE is 'new'`, () => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'new';
      // default connectionState in mock is 'connected'
      expect(publisher.isStable()).toBe(false);
    });

    it(`isStable() returns true when ICE is 'connected' and connectionState is 'connected'`, () => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'connected';
      // @ts-expect-error private api
      publisher['pc'].connectionState = 'connected';
      expect(publisher.isStable()).toBe(true);
    });

    it(`isStable() returns true when ICE is 'completed' and connectionState is 'connected'`, () => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'completed';
      // @ts-expect-error private api
      publisher['pc'].connectionState = 'connected';
      expect(publisher.isStable()).toBe(true);
    });

    it(`isStable() returns false when ICE is 'disconnected'`, () => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      // @ts-expect-error private api
      publisher['pc'].connectionState = 'connected';
      expect(publisher.isStable()).toBe(false);
    });

    it(`after connected→disconnected→connected cycle, subsequent 'failed' DOES trigger ICE restart (flag stays true)`, () => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();

      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      publisher['onReconnectionNeeded'] = vi.fn();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();
      expect(publisher.restartIce).toHaveBeenCalled();
      // the reason here is the regular restart path, NOT 'ice_never_connected'
      expect(publisher['onReconnectionNeeded']).not.toHaveBeenCalledWith(
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.ICE_NEVER_CONNECTED,
        PeerType.PUBLISHER_UNSPECIFIED,
      );
    });

    it(`connection-state 'failed' (distinct from ICE state) still fires REJOIN even after ICE was connected`, () => {
      // mark ICE as connected first
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();

      publisher['onReconnectionNeeded'] = vi.fn();
      // @ts-expect-error private api
      publisher['pc'].connectionState = 'failed';
      publisher['onConnectionStateChange']();
      expect(publisher['onReconnectionNeeded']).toHaveBeenCalledWith(
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.CONNECTION_FAILED,
        PeerType.PUBLISHER_UNSPECIFIED,
      );
    });

    it(`'completed' state is treated as connectivity — subsequent 'failed' DOES trigger ICE restart`, () => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'completed';
      publisher['onIceConnectionStateChange']();

      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      publisher['onReconnectionNeeded'] = vi.fn();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();
      expect(publisher.restartIce).toHaveBeenCalled();
      expect(publisher['onReconnectionNeeded']).not.toHaveBeenCalledWith(
        WebsocketReconnectStrategy.REJOIN,
        ReconnectReason.ICE_NEVER_CONNECTED,
        PeerType.PUBLISHER_UNSPECIFIED,
      );
    });

    it(`should schedule ICE restart but cancel it if connection recovers in the meantime`, () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      vi.useFakeTimers();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();

      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'connected';
      publisher['onIceConnectionStateChange']();

      vi.runOnlyPendingTimers();
      expect(publisher.restartIce).not.toHaveBeenCalled();
      expect(publisher['iceRestartTimeout']).toBeUndefined();
    });
  });

  describe('Candidate-pair migration on reconnect', () => {
    const candidatePair = (
      local: string,
      remote: string,
    ): RTCIceCandidatePair =>
      ({
        local: { candidate: local },
        remote: { candidate: remote },
      }) as unknown as RTCIceCandidatePair;

    const publishVideo = async () => {
      // @ts-expect-error private API
      vi.spyOn(publisher, 'negotiate').mockResolvedValue(undefined);
      const track = new MediaStreamTrack();
      vi.spyOn(track, 'clone').mockReturnValue(new MediaStreamTrack());
      await publisher.publish(track, TrackType.VIDEO);
    };

    const iceTransportOf = (p: Publisher) =>
      (p['pc'].addTransceiver as any).mock.results[0].value.sender.transport
        .iceTransport;

    const setIceState = (s: RTCIceConnectionState) => {
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = s;
      publisher['onIceConnectionStateChange']();
    };

    it('cancels the scheduled restart when ICE recovers on the same candidate pair', async () => {
      vi.useFakeTimers();
      await publishVideo();
      const restartSpy = vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      iceTransportOf(publisher).__setSelectedCandidatePair(
        candidatePair('a', 'x'),
      );
      setIceState('connected'); // establish: ICE has connected at least once

      setIceState('disconnected'); // snapshots pair a/x, schedules restart
      setIceState('connected'); // recovers on the SAME pair

      vi.runOnlyPendingTimers();
      expect(restartSpy).not.toHaveBeenCalled();
      expect(publisher['iceRestartTimeout']).toBeUndefined();
    });

    it('restarts ICE when the path migrated while disconnected', async () => {
      vi.useFakeTimers();
      await publishVideo();
      const iceTransport = iceTransportOf(publisher);
      const restartSpy = vi.spyOn(publisher, 'restartIce').mockResolvedValue();

      iceTransport.__setSelectedCandidatePair(candidatePair('a', 'x'));
      setIceState('connected');

      setIceState('disconnected'); // snapshots a/x
      // recovers on a DIFFERENT pair (organic WiFi -> LTE migration)
      iceTransport.__setSelectedCandidatePair(candidatePair('b', 'y'));
      setIceState('connected');

      expect(restartSpy).toHaveBeenCalledTimes(1);
      expect(publisher['iceRestartTimeout']).toBeUndefined();
    });

    it('runs the scheduled restart if ICE stays disconnected', async () => {
      vi.useFakeTimers();
      await publishVideo();
      const restartSpy = vi.spyOn(publisher, 'restartIce').mockResolvedValue();

      setIceState('connected');
      setIceState('disconnected'); // schedules restart
      vi.advanceTimersByTime(2500);

      expect(restartSpy).toHaveBeenCalledTimes(1);
    });

    it('cancels the scheduled restart when the candidate-pair API is unavailable', async () => {
      vi.useFakeTimers();
      // no track published, so no ICE transport is captured (API unavailable)
      const restartSpy = vi.spyOn(publisher, 'restartIce').mockResolvedValue();

      setIceState('connected');
      setIceState('disconnected');
      setIceState('connected');

      vi.runOnlyPendingTimers();
      expect(restartSpy).not.toHaveBeenCalled();
    });

    it('does not loop: a migration restart settling on the new pair is not restarted again', async () => {
      vi.useFakeTimers();
      await publishVideo();
      const iceTransport = iceTransportOf(publisher);
      const restartSpy = vi.spyOn(publisher, 'restartIce').mockResolvedValue();

      iceTransport.__setSelectedCandidatePair(candidatePair('a', 'x'));
      setIceState('connected');

      setIceState('disconnected');
      iceTransport.__setSelectedCandidatePair(candidatePair('b', 'y'));
      setIceState('connected');
      expect(restartSpy).toHaveBeenCalledTimes(1); // organic migration restart

      // a later flap that recovers on the same (new) pair must NOT restart
      setIceState('disconnected');
      setIceState('connected');
      expect(restartSpy).toHaveBeenCalledTimes(1); // unchanged, no loop
    });
  });

  describe('changePublishQuality', () => {
    it('can dynamically activate/deactivate simulcast layers', async () => {
      const transceiver = new RTCRtpTransceiver();
      const setParametersSpy = vi
        .spyOn(transceiver.sender, 'setParameters')
        .mockResolvedValue();
      const getParametersSpy = vi
        .spyOn(transceiver.sender, 'getParameters')
        .mockReturnValue({
          codecs: [
            // @ts-expect-error incomplete data
            { mimeType: 'video/VP8' },
            // @ts-expect-error incomplete data
            { mimeType: 'video/VP9' },
            // @ts-expect-error incomplete data
            { mimeType: 'video/H264' },
            // @ts-expect-error incomplete data
            { mimeType: 'video/AV1' },
          ],
          encodings: [
            { rid: 'q', active: true },
            { rid: 'h', active: true },
            { rid: 'f', active: true },
          ],
        });

      // inject the transceiver
      publisher['transceiverCache'].add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
        options: {},
      });

      await publisher['changePublishQuality'](
        {
          publishOptionId: 1,
          trackType: TrackType.VIDEO,
          degradationPreference: DegradationPreference.UNSPECIFIED,
          layers: [
            {
              name: 'q',
              active: true,
              maxBitrate: 100,
              scaleResolutionDownBy: 4,
              maxFramerate: 30,
              scalabilityMode: '',
            },
            {
              name: 'h',
              active: false,
              maxBitrate: 150,
              scaleResolutionDownBy: 2,
              maxFramerate: 30,
              scalabilityMode: '',
            },
            {
              name: 'f',
              active: true,
              maxBitrate: 200,
              scaleResolutionDownBy: 1,
              maxFramerate: 30,
              scalabilityMode: '',
            },
          ],
        },
        publisher['transceiverCache'].getBy(1, TrackType.VIDEO),
      );

      expect(getParametersSpy).toHaveBeenCalled();
      expect(setParametersSpy).toHaveBeenCalled();
      expect(setParametersSpy.mock.calls[0][0].encodings).toEqual([
        {
          rid: 'q',
          active: true,
          maxBitrate: 100,
          scaleResolutionDownBy: 4,
          maxFramerate: 30,
        },
        {
          rid: 'h',
          active: false,
        },
        {
          rid: 'f',
          active: true,
          maxBitrate: 200,
          scaleResolutionDownBy: 1,
          maxFramerate: 30,
        },
      ]);
    });

    it('can dynamically activate/deactivate simulcast layers when rid is missing', async () => {
      const transceiver = new RTCRtpTransceiver();
      const setParametersSpy = vi
        .spyOn(transceiver.sender, 'setParameters')
        .mockResolvedValue();
      const getParametersSpy = vi
        .spyOn(transceiver.sender, 'getParameters')
        .mockReturnValue({
          // @ts-expect-error incomplete data
          codecs: [{ mimeType: 'video/VP8' }],
          encodings: [{ active: false }],
        });

      // inject the transceiver
      publisher['transceiverCache'].add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
        options: {},
      });

      await publisher['changePublishQuality'](
        {
          publishOptionId: 1,
          trackType: TrackType.VIDEO,
          degradationPreference: DegradationPreference.UNSPECIFIED,
          layers: [
            {
              name: 'q',
              active: true,
              maxBitrate: 100,
              scaleResolutionDownBy: 4,
              maxFramerate: 30,
              scalabilityMode: '',
            },
          ],
        },
        publisher['transceiverCache'].getBy(1, TrackType.VIDEO),
      );

      expect(getParametersSpy).toHaveBeenCalled();
      expect(setParametersSpy).toHaveBeenCalled();
      expect(setParametersSpy.mock.calls[0][0].encodings).toEqual([
        {
          active: true,
          maxBitrate: 100,
          scaleResolutionDownBy: 4,
          maxFramerate: 30,
        },
      ]);
    });

    it('can dynamically update scalability mode in SVC', async () => {
      const transceiver = new RTCRtpTransceiver();
      const setParametersSpy = vi
        .spyOn(transceiver.sender, 'setParameters')
        .mockResolvedValue();
      const getParametersSpy = vi
        .spyOn(transceiver.sender, 'getParameters')
        .mockReturnValue({
          codecs: [
            // @ts-expect-error incomplete data
            { mimeType: 'video/VP9' },
            // @ts-expect-error incomplete data
            { mimeType: 'video/AV1' },
            // @ts-expect-error incomplete data
            { mimeType: 'video/VP8' },
            // @ts-expect-error incomplete data
            { mimeType: 'video/H264' },
          ],
          encodings: [
            {
              rid: 'q',
              active: true,
              maxBitrate: 100,
              // @ts-expect-error not in the standard lib yet
              scalabilityMode: 'L3T3_KEY',
            },
          ],
        });

      // inject the transceiver
      publisher['transceiverCache'].add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
        options: {},
      });
      await publisher['changePublishQuality'](
        {
          publishOptionId: 1,
          trackType: TrackType.VIDEO,
          degradationPreference: DegradationPreference.UNSPECIFIED,
          layers: [
            {
              name: 'q',
              active: true,
              maxBitrate: 50,
              scaleResolutionDownBy: 1,
              maxFramerate: 30,
              scalabilityMode: 'L1T3',
            },
          ],
        },
        publisher['transceiverCache'].getBy(1, TrackType.VIDEO),
      );

      expect(getParametersSpy).toHaveBeenCalled();
      expect(setParametersSpy).toHaveBeenCalled();
      expect(setParametersSpy.mock.calls[0][0].encodings).toEqual([
        {
          rid: 'q',
          active: true,
          maxBitrate: 50,
          scaleResolutionDownBy: 1,
          maxFramerate: 30,
          scalabilityMode: 'L1T3',
        },
      ]);
    });

    it('supports empty rid in SVC', async () => {
      const transceiver = new RTCRtpTransceiver();
      const setParametersSpy = vi
        .spyOn(transceiver.sender, 'setParameters')
        .mockResolvedValue();
      const getParametersSpy = vi
        .spyOn(transceiver.sender, 'getParameters')
        .mockReturnValue({
          codecs: [
            // @ts-expect-error incomplete data
            { mimeType: 'video/VP9' },
          ],
          encodings: [
            {
              rid: undefined, // empty rid
              active: true,
              // @ts-expect-error not in the standard lib yet
              scalabilityMode: 'L3T3_KEY',
            },
          ],
        });

      // inject the transceiver
      publisher['transceiverCache'].add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
        options: {},
      });

      await publisher['changePublishQuality'](
        {
          publishOptionId: 1,
          trackType: TrackType.VIDEO,
          degradationPreference: DegradationPreference.UNSPECIFIED,
          layers: [
            {
              name: 'q',
              active: true,
              maxBitrate: 50,
              scaleResolutionDownBy: 1,
              maxFramerate: 30,
              scalabilityMode: 'L1T3',
            },
          ],
        },
        publisher['transceiverCache'].getBy(1, TrackType.VIDEO),
      );

      expect(getParametersSpy).toHaveBeenCalled();
      expect(setParametersSpy).toHaveBeenCalled();
      expect(setParametersSpy.mock.calls[0][0].encodings).toEqual([
        {
          active: true,
          maxBitrate: 50,
          scaleResolutionDownBy: 1,
          maxFramerate: 30,
          scalabilityMode: 'L1T3',
        },
      ]);
    });

    it('applies degradationPreference from the SFU event', async () => {
      const transceiver = new RTCRtpTransceiver();
      const setParametersSpy = vi
        .spyOn(transceiver.sender, 'setParameters')
        .mockResolvedValue();
      vi.spyOn(transceiver.sender, 'getParameters').mockReturnValue({
        // @ts-expect-error incomplete data
        codecs: [{ mimeType: 'video/VP8' }],
        encodings: [{ rid: 'q', active: true }],
        degradationPreference: 'maintain-framerate',
      });

      publisher['transceiverCache'].add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
        options: {},
      });

      await publisher['changePublishQuality'](
        {
          publishOptionId: 1,
          trackType: TrackType.VIDEO,
          degradationPreference: DegradationPreference.BALANCED,
          layers: [
            {
              name: 'q',
              active: true,
              maxBitrate: 100,
              scaleResolutionDownBy: 1,
              maxFramerate: 30,
              scalabilityMode: '',
            },
          ],
        },
        publisher['transceiverCache'].getBy(1, TrackType.VIDEO),
      );

      expect(setParametersSpy).toHaveBeenCalled();
      expect(setParametersSpy.mock.calls[0][0].degradationPreference).toBe(
        'balanced',
      );
    });

    it('does not call setParameters when nothing changes and degradationPreference is UNSPECIFIED', async () => {
      const transceiver = new RTCRtpTransceiver();
      const setParametersSpy = vi
        .spyOn(transceiver.sender, 'setParameters')
        .mockResolvedValue();
      vi.spyOn(transceiver.sender, 'getParameters').mockReturnValue({
        // @ts-expect-error incomplete data
        codecs: [{ mimeType: 'video/VP8' }],
        encodings: [
          {
            rid: 'q',
            active: true,
            maxBitrate: 100,
            scaleResolutionDownBy: 1,
            maxFramerate: 30,
          },
        ],
        degradationPreference: 'maintain-framerate',
      });

      publisher['transceiverCache'].add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
        options: {},
      });

      await publisher['changePublishQuality'](
        {
          publishOptionId: 1,
          trackType: TrackType.VIDEO,
          degradationPreference: DegradationPreference.UNSPECIFIED,
          layers: [
            {
              name: 'q',
              active: true,
              maxBitrate: 100,
              scaleResolutionDownBy: 1,
              maxFramerate: 30,
              scalabilityMode: '',
            },
          ],
        },
        publisher['transceiverCache'].getBy(1, TrackType.VIDEO),
      );

      expect(setParametersSpy).not.toHaveBeenCalled();
    });
  });

  describe('changePublishOptions', () => {
    it('adds missing transceivers', async () => {
      const transceiver = new RTCRtpTransceiver();
      const track = new MediaStreamTrack();
      vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);
      vi.spyOn(track, 'clone').mockReturnValue(track);
      // @ts-expect-error private method
      vi.spyOn(publisher, 'addTransceiver');
      // @ts-expect-error private method
      vi.spyOn(publisher, 'negotiate').mockResolvedValue();

      publisher['publishOptions'] = [
        {
          trackType: TrackType.VIDEO,
          id: 0,
          // @ts-expect-error incomplete data
          codec: { name: 'vp8' },
          degradationPreference: DegradationPreference.UNSPECIFIED,
        },
        {
          trackType: TrackType.VIDEO,
          id: 1,
          // @ts-expect-error incomplete data
          codec: { name: 'av1' },
          degradationPreference: DegradationPreference.UNSPECIFIED,
        },
        {
          trackType: TrackType.VIDEO,
          id: 2,
          // @ts-expect-error incomplete data
          codec: { name: 'vp9' },
          degradationPreference: DegradationPreference.UNSPECIFIED,
        },
      ];

      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver,
        options: {},
      });

      vi.spyOn(publisher, 'isPublishing').mockReturnValue(true);

      // enable av1 and vp9
      await publisher['syncPublishOptions']();

      expect(publisher['transceiverCache'].items().length).toBe(3);
      expect(publisher['addTransceiver']).toHaveBeenCalledTimes(2);
      expect(publisher['addTransceiver']).toHaveBeenCalledWith(
        track,
        expect.objectContaining({
          trackType: TrackType.VIDEO,
          id: 1,
          codec: { name: 'av1' },
        }),
        {},
      );
      expect(publisher['addTransceiver']).toHaveBeenCalledWith(
        track,
        expect.objectContaining({
          trackType: TrackType.VIDEO,
          id: 2,
          codec: { name: 'vp9' },
        }),
        {},
      );
      expect(publisher['negotiate']).toHaveBeenCalledTimes(2);
    });

    it('disables extra transceivers', async () => {
      const publishOptions: PublishOption[] = [
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 0, codec: { name: 'vp8' } },
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 1, codec: { name: 'av1' } },
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 2, codec: { name: 'vp9' } },
      ];

      const track = new MediaStreamTrack();
      const transceiver = new RTCRtpTransceiver();
      // @ts-expect-error test setup
      transceiver.sender.track = track;

      publisher['transceiverCache'].add({
        publishOption: publishOptions[0],
        transceiver,
        options: {},
      });
      publisher['transceiverCache'].add({
        publishOption: publishOptions[1],
        transceiver,
        options: {},
      });
      publisher['transceiverCache'].add({
        publishOption: publishOptions[2],
        transceiver,
        options: {},
      });

      vi.spyOn(publisher, 'isPublishing').mockReturnValue(true);
      // disable av1
      publisher['publishOptions'] = publishOptions.filter(
        (o) => o.codec?.name !== 'av1',
      );

      await publisher['syncPublishOptions']();

      expect(publisher['transceiverCache'].items().length).toBe(3);
      expect(track.stop).toHaveBeenCalledOnce();
      expect(transceiver.sender.replaceTrack).toHaveBeenCalledOnce();
      expect(transceiver.sender.replaceTrack).toHaveBeenCalledWith(null);
    });
  });

  describe('negotiation and track management', () => {
    let cache: TransceiverCache;

    beforeEach(() => {
      cache = publisher['transceiverCache'];
      const videoTransceiver = new RTCRtpTransceiver();
      const track = new MediaStreamTrack();
      vi.spyOn(track, 'enabled', 'get').mockReturnValue(true);
      vi.spyOn(videoTransceiver.sender, 'track', 'get').mockReturnValue(track);

      const inactiveTransceiver = new RTCRtpTransceiver();
      const inactiveTrack = new MediaStreamTrack();
      vi.spyOn(inactiveTrack, 'enabled', 'get').mockReturnValue(false);
      vi.spyOn(inactiveTransceiver.sender, 'track', 'get').mockReturnValue(
        inactiveTrack,
      );
      vi.spyOn(inactiveTrack, 'readyState', 'get').mockReturnValue('ended');

      const audioTransceiver = new RTCRtpTransceiver();
      const audioTrack = new MediaStreamTrack();
      vi.spyOn(audioTrack, 'kind', 'get').mockReturnValue('audio');
      vi.spyOn(audioTrack, 'enabled', 'get').mockReturnValue(true);
      vi.spyOn(audioTransceiver.sender, 'track', 'get').mockReturnValue(
        audioTrack,
      );

      cache.add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.VIDEO, id: 1 },
        transceiver: videoTransceiver,
        options: {},
      });
      cache.add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.VIDEO, id: 2 },
        transceiver: inactiveTransceiver,
        options: {},
      });
      cache.add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.AUDIO, id: 3 },
        transceiver: audioTransceiver,
        options: {},
      });

      publisher['clonedTracks'].add(track).add(inactiveTrack).add(audioTrack);
      publisher['trackIdToTrackType']
        .set(track.id, TrackType.VIDEO)
        .set(inactiveTrack.id, TrackType.VIDEO)
        .set(audioTrack.id, TrackType.AUDIO);
    });

    it('negotiate should set up the local and remote descriptions', async () => {
      const spyOffer: RTCSessionDescriptionInit = {
        sdp: 'offer-sdp',
        type: 'offer',
      };
      const createOfferSpy = vi
        .spyOn(publisher['pc'], 'createOffer')
        // @ts-expect-error TS picks up the wrong overload
        .mockResolvedValue(spyOffer);

      const setLocalDescriptionSpy = vi
        .spyOn(publisher['pc'], 'setLocalDescription')
        .mockResolvedValue();

      const setRemoteDescriptionSpy = vi
        .spyOn(publisher['pc'], 'setRemoteDescription')
        .mockResolvedValue();

      const addIceCandidateSpy = vi
        .spyOn(publisher['pc'], 'addIceCandidate')
        .mockResolvedValue();

      sfuClient.setPublisher = vi.fn().mockResolvedValue({
        response: {
          sdp: 'answer-sdp',
        },
      });

      // @ts-expect-error incomplete data
      const trackInfosMock: TrackInfo[] = [{ trackId: '123' }];
      vi.spyOn(publisher, 'getAnnouncedTracks').mockReturnValue(trackInfosMock);

      sfuClient['iceTrickleBuffer'].push({
        peerType: PeerType.PUBLISHER_UNSPECIFIED,
        iceCandidate: '{ "ufrag": "test", "candidate": "test" }',
      });

      await publisher['negotiate']();

      expect(sfuClient.setPublisher).toHaveBeenCalledWith({
        sdp: 'offer-sdp',
        tracks: trackInfosMock,
      });
      expect(createOfferSpy).toHaveBeenCalled();
      expect(setLocalDescriptionSpy).toHaveBeenCalledWith(spyOffer);
      expect(setRemoteDescriptionSpy).toHaveBeenCalledWith({
        sdp: 'answer-sdp',
        type: 'answer',
      });
      expect(addIceCandidateSpy).toHaveBeenCalledWith({
        ufrag: 'test',
        candidate: 'test',
      });
    });

    it('getPublishedTracks returns the published tracks', () => {
      const tracks = publisher.getPublishedTracks();
      expect(tracks).toHaveLength(2);
      expect(tracks[0].readyState).toBe('live');
    });

    it('getAnnouncedTracks should return all tracks', () => {
      const trackInfos = publisher.getAnnouncedTracks('');
      expect(trackInfos).toHaveLength(3);
      expect(trackInfos[0].muted).toBe(false);
      expect(trackInfos[0].mid).toBe('0');
      expect(trackInfos[1].muted).toBe(true);
      expect(trackInfos[1].mid).toBe('1');
    });

    it('getAnnouncedTracksForReconnect should return only the active tracks', () => {
      const trackInfos = publisher.getAnnouncedTracksForReconnect();
      expect(trackInfos).toHaveLength(1);
      expect(trackInfos[0].muted).toBe(false);
      expect(trackInfos[0].mid).toBe('0');
    });

    it('isPublishing should return true if there are active tracks', () => {
      expect(publisher.isPublishing(TrackType.VIDEO)).toBe(true);
      expect(publisher.isPublishing(TrackType.SCREEN_SHARE_AUDIO)).toBe(false);
      expect(publisher.isPublishing()).toBe(true);
    });

    it('getTrackType should return the track type', () => {
      expect(
        publisher.getTrackType(cache['cache'][0].transceiver.sender.track!.id),
      ).toBe(TrackType.VIDEO);
      expect(publisher.getTrackType('unknown')).toBeUndefined();
    });

    it('stopTracks should stop tracks', async () => {
      const track = cache['cache'][0].transceiver.sender.track!;
      vi.spyOn(track, 'stop');
      expect(publisher['clonedTracks'].size).toBe(3);
      await publisher.stopTracks(TrackType.VIDEO);
      expect(track!.stop).toHaveBeenCalled();
      expect(publisher['clonedTracks'].size).toBe(1);
    });

    it('stopAllTracks should stop all tracks', async () => {
      const track = cache['cache'][0].transceiver.sender.track!;
      vi.spyOn(track, 'stop');
      expect(publisher['clonedTracks'].size).toBe(3);
      await publisher.stopAllTracks();
      expect(track!.stop).toHaveBeenCalled();
      expect(publisher['clonedTracks'].size).toBe(0);
    });
  });

  describe('Firefox unpublish workaround', () => {
    const mockSenderParams = (
      transceiver: RTCRtpTransceiver,
      encodings: RTCRtpEncodingParameters[],
    ) => {
      const getParametersSpy = vi
        .spyOn(transceiver.sender, 'getParameters')
        .mockReturnValue(fromPartial({ codecs: [], encodings }));
      const setParametersSpy = vi
        .spyOn(transceiver.sender, 'setParameters')
        .mockResolvedValue();
      return { getParametersSpy, setParametersSpy };
    };

    afterEach(() => {
      vi.mocked(isFirefox).mockReturnValue(false);
    });

    it('on Firefox, stopTracks deactivates video sender encodings before stopping the track', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      const transceiver = new RTCRtpTransceiver();
      const track = new MediaStreamTrack();
      vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);
      const trackStopSpy = vi.spyOn(track, 'stop');
      const { setParametersSpy } = mockSenderParams(transceiver, [
        { rid: 'q', active: true },
        { rid: 'h', active: true },
        { rid: 'f', active: true },
      ]);

      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver,
        options: {},
      });

      await publisher.stopTracks(TrackType.VIDEO);

      expect(setParametersSpy).toHaveBeenCalledTimes(1);
      expect(setParametersSpy.mock.calls[0][0].encodings).toEqual([
        { rid: 'q', active: false },
        { rid: 'h', active: false },
        { rid: 'f', active: false },
      ]);
      // setParameters({active: false}) must run before track.stop() so the
      // encoder is paused before the local track ends
      expect(setParametersSpy.mock.invocationCallOrder[0]).toBeLessThan(
        trackStopSpy.mock.invocationCallOrder[0],
      );
      expect(trackStopSpy).toHaveBeenCalled();
    });

    it('on Firefox, stopTracks clears audio senders via replaceTrack(null), not setParameters', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      const audioTransceiver = new RTCRtpTransceiver();
      const audioTrack = new MediaStreamTrack();
      vi.spyOn(audioTransceiver.sender, 'track', 'get').mockReturnValue(
        audioTrack,
      );
      const trackStopSpy = vi.spyOn(audioTrack, 'stop');
      const replaceTrackSpy = vi
        .spyOn(audioTransceiver.sender, 'replaceTrack')
        .mockResolvedValue();
      const setParametersSpy = vi.spyOn(
        audioTransceiver.sender,
        'setParameters',
      );

      publisher['transceiverCache'].add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.AUDIO, id: 99 },
        transceiver: audioTransceiver,
        options: {},
      });

      await publisher.stopTracks(TrackType.AUDIO);

      // setParameters({encodings:[...active:false]}) does NOT stop the
      // Opus encoder on Firefox; replaceTrack(null) is the only reliable
      // wire silencer for audio.
      expect(setParametersSpy).not.toHaveBeenCalled();
      expect(replaceTrackSpy).toHaveBeenCalledWith(null);
      expect(replaceTrackSpy.mock.invocationCallOrder[0]).toBeLessThan(
        trackStopSpy.mock.invocationCallOrder[0],
      );
      expect(trackStopSpy).toHaveBeenCalled();
    });

    it('on Firefox, stopTracks leaves senders for other track types alone', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      const videoTransceiver = new RTCRtpTransceiver();
      vi.spyOn(videoTransceiver.sender, 'track', 'get').mockReturnValue(
        new MediaStreamTrack(),
      );
      const { setParametersSpy: videoSetParams } = mockSenderParams(
        videoTransceiver,
        [{ rid: 'q', active: true }],
      );

      const audioTransceiver = new RTCRtpTransceiver();
      vi.spyOn(audioTransceiver.sender, 'track', 'get').mockReturnValue(
        new MediaStreamTrack(),
      );
      const audioReplaceTrack = vi
        .spyOn(audioTransceiver.sender, 'replaceTrack')
        .mockResolvedValue();

      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver: videoTransceiver,
        options: {},
      });
      publisher['transceiverCache'].add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.AUDIO, id: 99 },
        transceiver: audioTransceiver,
        options: {},
      });

      await publisher.stopTracks(TrackType.VIDEO);

      expect(videoSetParams).toHaveBeenCalledTimes(1);
      expect(audioReplaceTrack).not.toHaveBeenCalled();
    });

    it('on non-Firefox, stopTracks does not call setParameters or replaceTrack and still stops the track', async () => {
      // default: isFirefox() === false
      const transceiver = new RTCRtpTransceiver();
      const track = new MediaStreamTrack();
      vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);
      const trackStopSpy = vi.spyOn(track, 'stop');
      const { setParametersSpy } = mockSenderParams(transceiver, [
        { rid: 'q', active: true },
      ]);
      const replaceTrackSpy = vi.spyOn(transceiver.sender, 'replaceTrack');

      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver,
        options: {},
      });

      await publisher.stopTracks(TrackType.VIDEO);

      expect(setParametersSpy).not.toHaveBeenCalled();
      expect(replaceTrackSpy).not.toHaveBeenCalled();
      expect(trackStopSpy).toHaveBeenCalled();
    });

    it('on Firefox, stopAllTracks deactivates video encodings and clears audio sender tracks', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      const videoTransceiver = new RTCRtpTransceiver();
      vi.spyOn(videoTransceiver.sender, 'track', 'get').mockReturnValue(
        new MediaStreamTrack(),
      );
      const { setParametersSpy: videoSetParams } = mockSenderParams(
        videoTransceiver,
        [{ rid: 'q', active: true }],
      );

      const audioTransceiver = new RTCRtpTransceiver();
      vi.spyOn(audioTransceiver.sender, 'track', 'get').mockReturnValue(
        new MediaStreamTrack(),
      );
      const audioReplaceTrack = vi
        .spyOn(audioTransceiver.sender, 'replaceTrack')
        .mockResolvedValue();

      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver: videoTransceiver,
        options: {},
      });
      publisher['transceiverCache'].add({
        // @ts-expect-error incomplete data
        publishOption: { trackType: TrackType.AUDIO, id: 99 },
        transceiver: audioTransceiver,
        options: {},
      });

      await publisher.stopAllTracks();

      // each track type uses the lever that actually works for it on Firefox
      expect(videoSetParams).toHaveBeenCalledTimes(1);
      expect(audioReplaceTrack).toHaveBeenCalledWith(null);
    });

    it('on Firefox, re-publishing a video track on an existing transceiver re-activates encodings', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      const transceiver = new RTCRtpTransceiver();
      const initialTrack = new MediaStreamTrack();
      vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(
        initialTrack,
      );
      const { setParametersSpy } = mockSenderParams(transceiver, [
        { rid: 'q', active: true },
        { rid: 'h', active: true },
        { rid: 'f', active: true },
      ]);

      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver,
        options: {},
      });

      // stopping seeds the bundle's videoSender from the current encoder
      // state and flips encodings to active=false
      await publisher.stopTracks(TrackType.VIDEO);
      expect(setParametersSpy).toHaveBeenCalledTimes(1);
      expect(setParametersSpy.mock.calls[0][0].encodings).toEqual([
        { rid: 'q', active: false },
        { rid: 'h', active: false },
        { rid: 'f', active: false },
      ]);

      // re-publishing reads the cached snapshot and restores active=true
      const newTrack = new MediaStreamTrack();
      const clone = new MediaStreamTrack();
      vi.spyOn(newTrack, 'clone').mockReturnValue(clone);

      await publisher.publish(newTrack, TrackType.VIDEO);

      expect(transceiver.sender.replaceTrack).toHaveBeenCalledWith(clone);
      expect(setParametersSpy).toHaveBeenCalledTimes(2);
      expect(setParametersSpy.mock.calls[1][0].encodings).toEqual([
        { rid: 'q', active: true },
        { rid: 'h', active: true },
        { rid: 'f', active: true },
      ]);
    });

    it('on Firefox, restores each video publishOption independently across multiple codecs', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      publisher['publishOptions'] = [
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 10, codec: { name: 'vp8' } },
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 11, codec: { name: 'vp9' } },
      ];

      const vp8Transceiver = new RTCRtpTransceiver();
      vi.spyOn(vp8Transceiver.sender, 'track', 'get').mockReturnValue(
        new MediaStreamTrack(),
      );
      const { setParametersSpy: vp8Spy } = mockSenderParams(vp8Transceiver, [
        { rid: 'q', active: true },
      ]);

      const vp9Transceiver = new RTCRtpTransceiver();
      vi.spyOn(vp9Transceiver.sender, 'track', 'get').mockReturnValue(
        new MediaStreamTrack(),
      );
      const { setParametersSpy: vp9Spy } = mockSenderParams(vp9Transceiver, [
        { rid: 'q', active: true },
      ]);

      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver: vp8Transceiver,
        options: {},
      });
      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][1],
        transceiver: vp9Transceiver,
        options: {},
      });

      await publisher.stopTracks(TrackType.VIDEO);
      expect(vp8Spy).toHaveBeenCalledTimes(1);
      expect(vp9Spy).toHaveBeenCalledTimes(1);

      const vp8Bundle = publisher['transceiverCache'].get(
        publisher['publishOptions'][0],
      );
      const vp9Bundle = publisher['transceiverCache'].get(
        publisher['publishOptions'][1],
      );
      expect(vp8Bundle?.videoSender).toMatchObject({ publishOptionId: 10 });
      expect(vp9Bundle?.videoSender).toMatchObject({ publishOptionId: 11 });

      const track = new MediaStreamTrack();
      const clone = new MediaStreamTrack();
      vi.spyOn(track, 'clone').mockReturnValue(clone);

      await publisher.publish(track, TrackType.VIDEO);

      expect(vp8Transceiver.sender.replaceTrack).toHaveBeenCalledWith(clone);
      expect(vp9Transceiver.sender.replaceTrack).toHaveBeenCalledWith(clone);
      expect(vp8Spy).toHaveBeenCalledTimes(2);
      expect(vp9Spy).toHaveBeenCalledTimes(2);
      expect(vp8Spy.mock.calls[1][0].encodings).toEqual([
        { rid: 'q', active: true },
      ]);
      expect(vp9Spy.mock.calls[1][0].encodings).toEqual([
        { rid: 'q', active: true },
      ]);
    });

    it('on Firefox, the video path is a no-op when the sender has no encodings', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      const transceiver = new RTCRtpTransceiver();
      vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(
        new MediaStreamTrack(),
      );
      // default mock getParameters returns {}, no encodings field
      const setParametersSpy = vi.spyOn(transceiver.sender, 'setParameters');

      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver,
        options: {},
      });

      await expect(
        publisher.stopTracks(TrackType.VIDEO),
      ).resolves.toBeUndefined();
      expect(setParametersSpy).not.toHaveBeenCalled();
    });

    it('on Firefox, defers changePublishQuality while not publishing and applies on next publish', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      // transceiver exists but has no track attached: isPublishing → false
      const transceiver = new RTCRtpTransceiver();
      const { setParametersSpy } = mockSenderParams(transceiver, [
        { rid: 'q', active: false },
      ]);

      const publishOption = publisher['publishOptions'][0];
      publisher['transceiverCache'].add({
        publishOption,
        transceiver,
        options: {},
      });

      // SFU sends a changePublishQuality while we are not publishing.
      // On Firefox this should be cached but not applied.
      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'changePublishQuality',
            changePublishQuality: {
              audioSenders: [],
              videoSenders: [
                {
                  publishOptionId: publishOption.id,
                  trackType: TrackType.VIDEO,
                  layers: [
                    {
                      name: 'q',
                      active: true,
                      maxBitrate: 1_000_000,
                      scaleResolutionDownBy: 1,
                      maxFramerate: 30,
                      scalabilityMode: 'L1T3',
                    },
                  ],
                },
              ],
            },
          },
        }) as DispatchableMessage<'changePublishQuality'>,
        'test',
      );

      // cache populated immediately on the matching bundle, no setParameters
      // call yet
      expect(
        publisher['transceiverCache'].get(publishOption)?.videoSender,
      ).toMatchObject({
        publishOptionId: publishOption.id,
        trackType: TrackType.VIDEO,
        layers: [{ name: 'q', active: true, maxBitrate: 1_000_000 }],
      });
      expect(setParametersSpy).not.toHaveBeenCalled();

      // Now publish: updateTransceiver should pull from cache and apply
      const track = new MediaStreamTrack();
      const clone = new MediaStreamTrack();
      vi.spyOn(track, 'clone').mockReturnValue(clone);

      await publisher.publish(track, TrackType.VIDEO);

      expect(transceiver.sender.replaceTrack).toHaveBeenCalledWith(clone);
      expect(setParametersSpy).toHaveBeenCalledTimes(1);
      expect(setParametersSpy.mock.calls[0][0].encodings[0]).toMatchObject({
        rid: 'q',
        active: true,
        maxBitrate: 1_000_000,
        maxFramerate: 30,
        scaleResolutionDownBy: 1,
      });
    });

    it('on Firefox, serializes stopTracks against changePublishQuality so an inbound event cannot reactivate the encoder mid-stop', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      const transceiver = new RTCRtpTransceiver();
      const track = new MediaStreamTrack();
      vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);
      // make track.stop() actually flip readyState, matching real browser
      // semantics - isPublishing relies on it
      const trackStopSpy = vi.spyOn(track, 'stop').mockImplementation(() => {
        // @ts-expect-error readonly field
        track.readyState = 'ended';
      });

      const { setParametersSpy } = mockSenderParams(transceiver, [
        { rid: 'q', active: true },
      ]);
      // hold setParameters open so we can race a quality event during the
      // disable phase
      const { promise: setParamsPromise, resolve: resolveSetParams } =
        promiseWithResolvers<void>();
      setParametersSpy.mockReturnValue(setParamsPromise);

      const publishOption = publisher['publishOptions'][0];
      publisher['transceiverCache'].add({
        publishOption,
        transceiver,
        options: {},
      });

      // kick off stopTracks but don't await it yet
      const stopPromise = publisher.stopTracks(TrackType.VIDEO);

      // give the loop a microtask to start the await on setParameters
      await Promise.resolve();
      await Promise.resolve();

      // mid-stop: SFU dispatches a quality event
      dispatcher.dispatch(
        SfuEvent.create({
          eventPayload: {
            oneofKind: 'changePublishQuality',
            changePublishQuality: {
              audioSenders: [],
              videoSenders: [
                {
                  publishOptionId: publishOption.id,
                  trackType: TrackType.VIDEO,
                  layers: [
                    {
                      name: 'q',
                      active: true,
                      maxBitrate: 1_000_000,
                      scaleResolutionDownBy: 1,
                      maxFramerate: 30,
                      scalabilityMode: 'L1T3',
                    },
                  ],
                },
              ],
            },
          },
        }) as DispatchableMessage<'changePublishQuality'>,
        'test',
      );

      // event handler is blocked behind stopTracks' lock - setParameters
      // has only been called once (from disableAllEncodings) and the track
      // has not been stopped yet
      expect(setParametersSpy).toHaveBeenCalledTimes(1);
      expect(trackStopSpy).not.toHaveBeenCalled();

      // release setParameters; stopTracks finishes, lock released, the
      // queued quality event handler then runs
      resolveSetParams();
      await stopPromise;
      await new Promise<void>((r) => setTimeout(r, 0));

      // track was stopped, and the queued quality event was deferred:
      // setParameters was NOT called a second time (track ended → not publishing)
      expect(trackStopSpy).toHaveBeenCalled();
      expect(setParametersSpy).toHaveBeenCalledTimes(1);

      // but the SFU's intent is cached on the bundle for the next publish
      expect(
        publisher['transceiverCache'].get(publishOption)?.videoSender,
      ).toMatchObject({
        publishOptionId: publishOption.id,
        layers: [{ name: 'q', active: true, maxBitrate: 1_000_000 }],
      });
    });

    it('on Firefox, helper is a no-op once the publisher is disposed', async () => {
      vi.mocked(isFirefox).mockReturnValue(true);

      const transceiver = new RTCRtpTransceiver();
      const track = new MediaStreamTrack();
      vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);
      const trackStopSpy = vi.spyOn(track, 'stop');
      const { setParametersSpy } = mockSenderParams(transceiver, [
        { rid: 'q', active: true },
      ]);

      publisher['transceiverCache'].add({
        publishOption: publisher['publishOptions'][0],
        transceiver,
        options: {},
      });

      // simulates the state after super.dispose() has run inside dispose()
      publisher['isDisposed'] = true;

      await publisher.stopTracks(TrackType.VIDEO);

      // setParameters is skipped because the PC is being torn down
      expect(setParametersSpy).not.toHaveBeenCalled();
      // track.stop() still runs so local resources are released
      expect(trackStopSpy).toHaveBeenCalled();
    });
  });
});
