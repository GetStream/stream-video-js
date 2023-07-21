import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Publisher } from '../Publisher';
import { CallState } from '../../store';
import { StreamSfuClient } from '../../StreamSfuClient';
import { Dispatcher } from '../Dispatcher';
import { PeerType, TrackType } from '../../gen/video/sfu/models/models';
import { IceTrickleBuffer } from '../IceTrickleBuffer';
import { SfuEvent } from '../../gen/video/sfu/event/events';

vi.mock('../../StreamSfuClient', () => {
  console.log('MOCKING StreamSfuClient');
  return {
    StreamSfuClient: vi.fn(),
  };
});

vi.mock('../codecs', () => {
  return {
    getPreferredCodecs: vi.fn((): RTCRtpCodecCapability[] => [
      {
        channels: 1,
        clockRate: 48000,
        mimeType: 'video/h264',
        sdpFmtpLine: 'profile-level-id=42e01f',
      },
    ]),
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
      sfuServer: {
        url: 'https://getstream.io/',
        ws_endpoint: 'https://getstream.io/ws',
        edge_name: 'sfu-1',
      },
      token: 'token',
    });

    // @ts-ignore
    sfuClient['sessionId'] = sessionId;

    state = new CallState();
    publisher = new Publisher({
      sfuClient,
      dispatcher,
      state,
      isDtxEnabled: true,
      isRedEnabled: true,
      iceRestartDelay: 100,
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

    expect(state.localParticipant?.videoDeviceId).toEqual('test-device-id');
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
    expect(track.removeEventListener).toHaveBeenCalledWith(
      'ended',
      expect.any(Function),
    );
    expect(newTrack.addEventListener).toHaveBeenCalledWith(
      'ended',
      expect.any(Function),
    );
    expect(transceiver.sender.replaceTrack).toHaveBeenCalledWith(newTrack);
    expect(state.localParticipant?.videoDeviceId).toEqual('test-device-id-2');

    // stop publishing
    await publisher.unpublishStream(TrackType.VIDEO);
    expect(newTrack.stop).toHaveBeenCalled();
    expect(state.localParticipant?.publishedTracks).not.toContain(
      TrackType.VIDEO,
    );
    expect(state.localParticipant?.videoDeviceId).toEqual('test-device-id-2');
  });

  describe('Publisher migration', () => {
    it('should update the sfuClient and peer connection configuration', async () => {
      const newSfuClient = new StreamSfuClient({
        dispatcher: new Dispatcher(),
        sfuServer: {
          url: 'https://getstream.io/',
          ws_endpoint: 'https://getstream.io/ws',
          edge_name: 'sfu-1',
        },
        token: 'token',
      });

      const newPeerConnectionConfig = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      };

      vi.spyOn(publisher['pc'], 'setConfiguration');
      // @ts-ignore
      publisher['pc'].iceConnectionState = 'connected';
      // @ts-ignore
      vi.spyOn(publisher, 'negotiate').mockReturnValue(Promise.resolve());
      vi.spyOn(publisher, 'isPublishing').mockReturnValue(true);

      await publisher.migrateTo(newSfuClient, newPeerConnectionConfig);

      expect(publisher['sfuClient']).toEqual(newSfuClient);
      expect(publisher['pc'].setConfiguration).toHaveBeenCalledWith(
        newPeerConnectionConfig,
      );
      expect(publisher['negotiate']).toHaveBeenCalledWith({ iceRestart: true });
    });

    it('should initiate ICE Restart when there are published tracks', async () => {
      vi.spyOn(publisher['pc'], 'getTransceivers').mockReturnValue([]);
      // @ts-ignore
      sfuClient['iceTrickleBuffer'] = new IceTrickleBuffer();
      sfuClient.setPublisher = vi.fn().mockResolvedValue({
        response: {
          sessionId: 'new-session-id',
          sdp: 'new-sdp',
          iceRestart: false,
        },
      });

      // @ts-ignore
      publisher['pc'].iceConnectionState = 'connected';
      vi.spyOn(publisher, 'isPublishing').mockReturnValue(true);
      vi.spyOn(publisher, 'getCurrentTrackInfos').mockReturnValue([
        // @ts-expect-error
        { layers: [], trackType: TrackType.AUDIO, mid: '0' },
      ]);

      await publisher.migrateTo(sfuClient, {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      expect(publisher['pc'].createOffer).toHaveBeenCalledWith({
        iceRestart: true,
      });
      expect(publisher['pc'].setLocalDescription).toHaveBeenCalled();
      expect(publisher['pc'].setRemoteDescription).toHaveBeenCalledWith({
        type: 'answer',
        sdp: 'new-sdp',
      });
      expect(sfuClient.setPublisher).toHaveBeenCalled();
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
        }),
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
        }),
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
      vi.useFakeTimers();

      // @ts-ignore
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();
      vi.runAllTimers();
      expect(publisher.restartIce).toHaveBeenCalled();
    });

    it(`should bail-out from ICE restart once connection recovers before timeout`, () => {
      vi.spyOn(publisher, 'restartIce').mockResolvedValue();
      vi.useFakeTimers();

      // @ts-ignore
      publisher['pc'].iceConnectionState = 'disconnected';
      publisher['onIceConnectionStateChange']();
      // @ts-ignore
      publisher['pc'].iceConnectionState = 'connected';

      vi.runAllTimers();
      expect(publisher.restartIce).not.toHaveBeenCalled();
    });
  });
});
