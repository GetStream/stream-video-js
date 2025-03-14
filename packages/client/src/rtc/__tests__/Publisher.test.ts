import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Publisher } from '../Publisher';
import { CallState } from '../../store';
import { StreamSfuClient } from '../../StreamSfuClient';
import { DispatchableMessage, Dispatcher } from '../Dispatcher';
import {
  PeerType,
  PublishOption,
  TrackInfo,
  TrackType,
} from '../../gen/video/sfu/models/models';
import { SfuEvent } from '../../gen/video/sfu/event/events';
import { IceTrickleBuffer } from '../IceTrickleBuffer';
import { StreamClient } from '../../coordinator/connection/client';
import { TransceiverCache } from '../TransceiverCache';

vi.mock('../../StreamSfuClient', () => {
  console.log('MOCKING StreamSfuClient');
  return {
    StreamSfuClient: vi.fn(),
  };
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
      credentials: {
        server: {
          url: 'https://getstream.io/',
          ws_endpoint: 'https://getstream.io/ws',
          edge_name: 'sfu-1',
        },
        token: 'token',
        ice_servers: [],
      },
      logTag: 'test',
    });

    // @ts-expect-error readonly field
    sfuClient.iceTrickleBuffer = new IceTrickleBuffer();

    // @ts-expect-error private field
    sfuClient['sessionId'] = sessionId;

    state = new CallState();
    publisher = new Publisher({
      sfuClient,
      dispatcher,
      state,
      logTag: 'test',
      publishOptions: [
        {
          id: 1,
          trackType: TrackType.VIDEO,
          bitrate: 1000,
          // @ts-expect-error - incomplete data
          codec: { name: 'vp9' },
          fps: 30,
          maxTemporalLayers: 3,
          maxSpatialLayers: 3,
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    publisher.dispose();
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
      publisher['transceiverCache'].add(
        publisher['publishOptions'][0],
        transceiver,
      );

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
                {
                  publishOptionId: 1,
                  trackType: TrackType.VIDEO,
                  layers: [],
                },
                {
                  publishOptionId: 2,
                  trackType: TrackType.SCREEN_SHARE,
                  layers: [],
                },
              ],
            },
          },
        }) as DispatchableMessage<'changePublishQuality'>,
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

    it(`should perform ICE restart when connection state changes to 'failed'`, () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();
      expect(publisher.restartIce).toHaveBeenCalled();
    });

    it(`should perform ICE restart when connection state changes to 'disconnected'`, () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      // @ts-expect-error private api
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();
      expect(publisher.restartIce).toHaveBeenCalled();
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
      publisher['transceiverCache'].add(
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
      );

      await publisher['changePublishQuality']({
        publishOptionId: 1,
        trackType: TrackType.VIDEO,
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
      });

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
      publisher['transceiverCache'].add(
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
      );

      await publisher['changePublishQuality']({
        publishOptionId: 1,
        trackType: TrackType.VIDEO,
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
      });

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
      publisher['transceiverCache'].add(
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
      );
      await publisher['changePublishQuality']({
        publishOptionId: 1,
        trackType: TrackType.VIDEO,
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
      });

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
      publisher['transceiverCache'].add(
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 1 },
        transceiver,
      );

      await publisher['changePublishQuality']({
        publishOptionId: 1,
        trackType: TrackType.VIDEO,
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
      });

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
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 0, codec: { name: 'vp8' } },
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 1, codec: { name: 'av1' } },
        // @ts-expect-error incomplete data
        { trackType: TrackType.VIDEO, id: 2, codec: { name: 'vp9' } },
      ];

      publisher['transceiverCache'].add(
        publisher['publishOptions'][0],
        transceiver,
      );

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
      );
      expect(publisher['addTransceiver']).toHaveBeenCalledWith(
        track,
        expect.objectContaining({
          trackType: TrackType.VIDEO,
          id: 2,
          codec: { name: 'vp9' },
        }),
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

      publisher['transceiverCache'].add(publishOptions[0], transceiver);
      publisher['transceiverCache'].add(publishOptions[1], transceiver);
      publisher['transceiverCache'].add(publishOptions[2], transceiver);

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
      const transceiver = new RTCRtpTransceiver();
      const track = new MediaStreamTrack();
      vi.spyOn(track, 'enabled', 'get').mockReturnValue(true);
      vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);

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

      // @ts-expect-error incomplete data
      cache.add({ trackType: TrackType.VIDEO, id: 1 }, transceiver);
      // @ts-expect-error incomplete data
      cache.add({ trackType: TrackType.VIDEO, id: 2 }, inactiveTransceiver);
      // @ts-expect-error incomplete data
      cache.add({ trackType: TrackType.AUDIO, id: 3 }, audioTransceiver);

      publisher['clonedTracks'].add(track).add(inactiveTrack).add(audioTrack);
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
    });

    it('getTrackType should return the track type', () => {
      expect(
        publisher.getTrackType(cache['cache'][0].transceiver.sender.track!.id),
      ).toBe(TrackType.VIDEO);
      expect(publisher.getTrackType('unknown')).toBeUndefined();
    });

    it('stopTracks should stop tracks', () => {
      const track = cache['cache'][0].transceiver.sender.track!;
      vi.spyOn(track, 'stop');
      expect(publisher['clonedTracks'].size).toBe(3);
      publisher.stopTracks(TrackType.VIDEO);
      expect(track!.stop).toHaveBeenCalled();
      expect(publisher['clonedTracks'].size).toBe(1);
    });

    it('stopAllTracks should stop all tracks', () => {
      const track = cache['cache'][0].transceiver.sender.track!;
      vi.spyOn(track, 'stop');
      expect(publisher['clonedTracks'].size).toBe(3);
      publisher.stopAllTracks();
      expect(track!.stop).toHaveBeenCalled();
      expect(publisher['clonedTracks'].size).toBe(0);
    });
  });
});
