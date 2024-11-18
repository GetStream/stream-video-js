import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Publisher } from '../Publisher';
import { CallState } from '../../store';
import { StreamSfuClient } from '../../StreamSfuClient';
import { DispatchableMessage, Dispatcher } from '../Dispatcher';
import { PeerType, TrackType } from '../../gen/video/sfu/models/models';
import { SfuEvent } from '../../gen/video/sfu/event/events';
import { IceTrickleBuffer } from '../IceTrickleBuffer';
import { StreamClient } from '../../coordinator/connection/client';

vi.mock('../../StreamSfuClient', () => {
  console.log('MOCKING StreamSfuClient');
  return {
    StreamSfuClient: vi.fn(),
  };
});

vi.mock('../codecs', async () => {
  const codecs = await vi.importActual('../codecs');
  return {
    getPreferredCodecs: vi.fn((): RTCRtpCodecCapability[] => [
      {
        channels: 1,
        clockRate: 48000,
        mimeType: 'video/h264',
        sdpFmtpLine: 'profile-level-id=42e01f',
      },
    ]),
    getOptimalVideoCodec: codecs.getOptimalVideoCodec,
    isSvcCodec: codecs.isSvcCodec,
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

    // @ts-ignore
    sfuClient['sessionId'] = sessionId;

    state = new CallState();
    publisher = new Publisher({
      sfuClient,
      dispatcher,
      state,
      isDtxEnabled: true,
      isRedEnabled: true,
      logTag: 'test',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    dispatcher.offAll();
  });

  it('can publish, re-publish and un-publish a stream', async () => {
    const mediaStream = new MediaStream();
    const track = new MediaStreamTrack();
    mediaStream.addTrack(track);

    state.setParticipants([
      // @ts-ignore
      {
        isLocalParticipant: true,
        userId: 'test-user-id',
        sessionId: sessionId,
        publishedTracks: [],
      },
    ]);

    vi.spyOn(track, 'getSettings').mockReturnValue({
      width: 640,
      height: 480,
      deviceId: 'test-device-id',
    });

    const transceiver = new RTCRtpTransceiver();
    vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);
    vi.spyOn(publisher['pc'], 'addTransceiver').mockReturnValue(transceiver);
    vi.spyOn(publisher['pc'], 'getTransceivers').mockReturnValue([transceiver]);

    sfuClient.updateMuteState = vi.fn();

    // initial publish
    await publisher.publishStream(mediaStream, track, TrackType.VIDEO);

    expect(state.localParticipant?.publishedTracks).toContain(TrackType.VIDEO);
    expect(state.localParticipant?.videoStream).toEqual(mediaStream);
    expect(transceiver.setCodecPreferences).toHaveBeenCalled();
    expect(sfuClient.updateMuteState).toHaveBeenCalledWith(
      TrackType.VIDEO,
      false,
    );
    expect(track.addEventListener).toHaveBeenCalledWith(
      'ended',
      expect.any(Function),
    );

    // re-publish a new track
    const newMediaStream = new MediaStream();
    const newTrack = new MediaStreamTrack();
    newMediaStream.addTrack(newTrack);

    vi.spyOn(newTrack, 'getSettings').mockReturnValue({
      width: 1280,
      height: 720,
      deviceId: 'test-device-id-2',
    });

    await publisher.publishStream(newMediaStream, newTrack, TrackType.VIDEO);
    vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(newTrack);

    expect(track.stop).toHaveBeenCalled();
    expect(newTrack.addEventListener).not.toHaveBeenCalledWith(
      'ended',
      expect.any(Function),
    );
    expect(transceiver.sender.replaceTrack).toHaveBeenCalledWith(newTrack);

    // stop publishing
    await publisher.unpublishStream(TrackType.VIDEO, true);
    expect(newTrack.stop).toHaveBeenCalled();
    expect(state.localParticipant?.publishedTracks).not.toContain(
      TrackType.VIDEO,
    );
  });

  it('can publish and un-publish with just enabling and disabling tracks', async () => {
    const mediaStream = new MediaStream();
    const track = new MediaStreamTrack();
    mediaStream.addTrack(track);

    state.setParticipants([
      // @ts-ignore
      {
        isLocalParticipant: true,
        userId: 'test-user-id',
        sessionId: sessionId,
        publishedTracks: [],
      },
    ]);

    vi.spyOn(track, 'getSettings').mockReturnValue({
      width: 640,
      height: 480,
      deviceId: 'test-device-id',
    });

    const transceiver = new RTCRtpTransceiver();
    vi.spyOn(transceiver.sender, 'track', 'get').mockReturnValue(track);
    vi.spyOn(publisher['pc'], 'addTransceiver').mockReturnValue(transceiver);
    vi.spyOn(publisher['pc'], 'getTransceivers').mockReturnValue([transceiver]);

    sfuClient.updateMuteState = vi.fn();

    // initial publish
    await publisher.publishStream(mediaStream, track, TrackType.VIDEO);

    expect(state.localParticipant?.publishedTracks).toContain(TrackType.VIDEO);
    expect(track.enabled).toBe(true);
    expect(state.localParticipant?.videoStream).toEqual(mediaStream);
    expect(transceiver.setCodecPreferences).toHaveBeenCalled();
    expect(sfuClient.updateMuteState).toHaveBeenCalledWith(
      TrackType.VIDEO,
      false,
    );

    expect(track.addEventListener).toHaveBeenCalledWith(
      'ended',
      expect.any(Function),
    );

    // stop publishing
    await publisher.unpublishStream(TrackType.VIDEO, false);
    expect(track.stop).not.toHaveBeenCalled();
    expect(track.enabled).toBe(false);
    expect(state.localParticipant?.publishedTracks).not.toContain(
      TrackType.VIDEO,
    );
    expect(state.localParticipant?.videoStream).toBeUndefined();

    const addEventListenerSpy = vi.spyOn(track, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(track, 'removeEventListener');

    // start publish again
    await publisher.publishStream(mediaStream, track, TrackType.VIDEO);

    expect(track.enabled).toBe(true);
    // republishing the same stream should use the previously registered event handlers
    expect(removeEventListenerSpy).not.toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalled();
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
      // @ts-ignore
      publisher['pc'].signalingState = 'have-local-offer';
      // @ts-ignore
      vi.spyOn(publisher, 'negotiate').mockResolvedValue();

      await publisher.restartIce();
      expect(publisher['negotiate']).not.toHaveBeenCalled();
    });

    it(`should perform ICE restart when connection state changes to 'failed'`, () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      // @ts-ignore
      publisher['pc'].iceConnectionState = 'failed';
      publisher['onIceConnectionStateChange']();
      expect(publisher.restartIce).toHaveBeenCalled();
    });

    it(`should perform ICE restart when connection state changes to 'disconnected'`, () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      // @ts-ignore
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
      publisher['transceiverCache'].set(TrackType.VIDEO, transceiver);

      await publisher['changePublishQuality']([
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
      ]);

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
          maxBitrate: 150,
          scaleResolutionDownBy: 2,
          maxFramerate: 30,
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
      publisher['transceiverCache'].set(TrackType.VIDEO, transceiver);

      await publisher['changePublishQuality']([
        {
          name: 'q',
          active: true,
          maxBitrate: 100,
          scaleResolutionDownBy: 4,
          maxFramerate: 30,
          scalabilityMode: '',
        },
      ]);

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
      publisher['transceiverCache'].set(TrackType.VIDEO, transceiver);

      await publisher['changePublishQuality']([
        {
          name: 'q',
          active: true,
          maxBitrate: 50,
          scaleResolutionDownBy: 1,
          maxFramerate: 30,
          scalabilityMode: 'L1T3',
        },
      ]);

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
      publisher['transceiverCache'].set(TrackType.VIDEO, transceiver);

      await publisher['changePublishQuality']([
        {
          name: 'q',
          active: true,
          maxBitrate: 50,
          scaleResolutionDownBy: 1,
          maxFramerate: 30,
          scalabilityMode: 'L1T3',
        },
      ]);

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
});
