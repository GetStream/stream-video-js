import './mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Publisher } from '../Publisher';
import { CallState } from '../../store';
import { StreamSfuClient } from '../../StreamSfuClient';
import { Dispatcher } from '../Dispatcher';
import { TrackType } from '../../gen/video/sfu/models/models';
import { IceTrickleBuffer } from '../IceTrickleBuffer';

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

  beforeEach(() => {
    const dispatcher = new Dispatcher();
    sfuClient = new StreamSfuClient({
      dispatcher,
      url: 'https://getstream.io/',
      wsEndpoint: 'https://getstream.io/ws',
      token: 'token',
    });

    // @ts-ignore
    sfuClient['sessionId'] = sessionId;

    state = new CallState();
    publisher = new Publisher({
      sfuClient,
      state,
      isDtxEnabled: true,
      isRedEnabled: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('can publish, re-publish and un-publish a stream', async () => {
    const mediaStream = new MediaStream();
    const track = new MediaStreamTrack();
    mediaStream.addTrack(track);

    state.setParticipants([
      // @ts-ignore
      {
        isLoggedInUser: true,
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
    vi.spyOn(publisher['publisher'], 'addTransceiver').mockReturnValue(
      transceiver,
    );
    vi.spyOn(publisher['publisher'], 'getTransceivers').mockReturnValue([
      transceiver,
    ]);

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
        url: 'https://getstream.io/',
        wsEndpoint: 'https://getstream.io/ws',
        token: 'token',
      });

      const newPeerConnectionConfig = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      };

      vi.spyOn(publisher['publisher'], 'setConfiguration');
      // @ts-ignore
      vi.spyOn(publisher, 'negotiate').mockReturnValue(Promise.resolve());

      await publisher.migrateTo(newSfuClient, newPeerConnectionConfig);

      expect(publisher['sfuClient']).toEqual(newSfuClient);
      expect(publisher['publisher'].setConfiguration).toHaveBeenCalledWith(
        newPeerConnectionConfig,
      );
      expect(publisher['negotiate']).toHaveBeenCalledWith({ iceRestart: true });
    });

    it('should initiate ICE Restart when tracks there are published tracks', async () => {
      // @ts-expect-error
      publisher.announcedTracks.push({ trackType: TrackType.VIDEO });

      vi.spyOn(publisher['publisher'], 'getTransceivers').mockReturnValue([]);
      // @ts-ignore
      sfuClient['iceTrickleBuffer'] = new IceTrickleBuffer();
      sfuClient.setPublisher = vi.fn().mockResolvedValue({
        response: {
          sessionId: 'new-session-id',
          sdp: 'new-sdp',
          iceRestart: false,
        },
      });

      await publisher.migrateTo(sfuClient, {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      expect(publisher['publisher'].createOffer).toHaveBeenCalledWith({
        iceRestart: true,
      });
      expect(publisher['publisher'].setLocalDescription).toHaveBeenCalled();
      expect(publisher['publisher'].setRemoteDescription).toHaveBeenCalledWith({
        type: 'answer',
        sdp: 'new-sdp',
      });
      expect(sfuClient.setPublisher).toHaveBeenCalled();
    });
  });
});
