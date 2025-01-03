import '../rtc/__tests__/mocks/webrtc.mocks';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { Publisher } from '../rtc';
import { StreamClient } from '../coordinator/connection/client';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { PermissionsContext } from '../permissions';
import { OwnCapability } from '../gen/coordinator';
import { StreamVideoWriteableStateStore } from '../store';
import { TrackType } from '../gen/video/sfu/models/models';
import { StreamSfuClient } from '../StreamSfuClient';

describe('Publishing and Unpublishing tracks', () => {
  let call: Call;

  beforeEach(async () => {
    call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient: new StreamClient('abc'),
      clientStore: new StreamVideoWriteableStateStore(),
    });

    const ctx = new PermissionsContext();
    ctx.setPermissions([
      OwnCapability.SEND_AUDIO,
      OwnCapability.SEND_VIDEO,
      OwnCapability.SCREENSHARE,
    ]);
    // @ts-expect-error permissionsContext is private
    call['permissionsContext'] = ctx;
  });

  describe('Validations', () => {
    it('publishing is not allowed only when call is not joined', async () => {
      const ms = new MediaStream();
      const err = 'Call not joined yet.';
      await expect(call.publishVideoStream(ms)).rejects.toThrowError(err);
      await expect(call.publishAudioStream(ms)).rejects.toThrowError(err);
      await expect(call.publishScreenShareStream(ms)).rejects.toThrowError(err);
    });

    it('publishing is not allowed when permissions are not set', async () => {
      // @ts-expect-error sfuClient is private
      call['sfuClient'] = {};

      call['permissionsContext'].setPermissions([]);

      const ms = new MediaStream();
      await expect(call.publishVideoStream(ms)).rejects.toThrowError(
        `No permission to publish video`,
      );
      await expect(call.publishAudioStream(ms)).rejects.toThrowError(
        'No permission to publish audio',
      );
      await expect(call.publishScreenShareStream(ms)).rejects.toThrowError(
        'No permission to publish screen share',
      );
    });

    it('publishing is not allowed when the publisher is not initialized', async () => {
      // @ts-expect-error sfuClient is private
      call['sfuClient'] = {};

      const ms = new MediaStream();
      await expect(call.publishVideoStream(ms)).rejects.toThrowError(
        'Publisher is not initialized',
      );
      await expect(call.publishAudioStream(ms)).rejects.toThrowError(
        'Publisher is not initialized',
      );
      await expect(call.publishScreenShareStream(ms)).rejects.toThrowError(
        'Publisher is not initialized',
      );
    });

    it('publishing is not allowed when there are no tracks in the stream', async () => {
      // @ts-expect-error sfuClient is private
      call['sfuClient'] = {};
      // @ts-expect-error publisher is private
      call['publisher'] = {};

      const ms = new MediaStream();
      vi.spyOn(ms, 'getVideoTracks').mockReturnValue([]);
      vi.spyOn(ms, 'getAudioTracks').mockReturnValue([]);

      await expect(call.publishVideoStream(ms)).rejects.toThrowError(
        'There is no video track in the stream',
      );
      await expect(call.publishAudioStream(ms)).rejects.toThrowError(
        'There is no audio track in the stream',
      );
      await expect(call.publishScreenShareStream(ms)).rejects.toThrowError(
        'There is no screen share track in the stream',
      );
    });
  });

  describe('Publishing and Unpublishing', () => {
    const sessionId = 'abc';
    let publisher: Publisher;
    let sfuClient: StreamSfuClient;

    beforeEach(() => {
      // @ts-expect-error partial data
      call.state.updateOrAddParticipant(sessionId, {
        sessionId,
        publishedTracks: [],
      });

      sfuClient = vi.fn() as unknown as StreamSfuClient;
      // @ts-expect-error sessionId is readonly
      sfuClient['sessionId'] = sessionId;
      sfuClient.updateMuteStates = vi.fn();

      publisher = vi.fn() as unknown as Publisher;
      publisher.publish = vi.fn();
      publisher.stopTracks = vi.fn();

      call['sfuClient'] = sfuClient;
      call.publisher = publisher;
    });

    it('publish video stream', async () => {
      const track = new MediaStreamTrack();
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getVideoTracks').mockReturnValue([track]);

      await call.publishVideoStream(mediaStream);
      expect(publisher.publish).toHaveBeenCalledWith(track, TrackType.VIDEO);
      expect(call['trackPublishOrder']).toEqual([TrackType.VIDEO]);

      expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
        { trackType: TrackType.VIDEO, muted: false },
      ]);

      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant).toBeDefined();
      expect(participant!.publishedTracks).toEqual([TrackType.VIDEO]);
      expect(participant!.videoStream).toEqual(mediaStream);
    });

    it('publish audio stream', async () => {
      const track = new MediaStreamTrack();
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getAudioTracks').mockReturnValue([track]);

      await call.publishAudioStream(mediaStream);
      expect(publisher.publish).toHaveBeenCalledWith(track, TrackType.AUDIO);
      expect(call['trackPublishOrder']).toEqual([TrackType.AUDIO]);

      expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
        { trackType: TrackType.AUDIO, muted: false },
      ]);

      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant).toBeDefined();
      expect(participant!.publishedTracks).toEqual([TrackType.AUDIO]);
      expect(participant!.audioStream).toEqual(mediaStream);
    });

    it('publish screen share stream', async () => {
      const track = new MediaStreamTrack();
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getVideoTracks').mockReturnValue([track]);

      await call.publishScreenShareStream(mediaStream);
      expect(publisher.publish).toHaveBeenCalledWith(
        track,
        TrackType.SCREEN_SHARE,
      );
      expect(call['trackPublishOrder']).toEqual([TrackType.SCREEN_SHARE]);

      expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
        { trackType: TrackType.SCREEN_SHARE, muted: false },
      ]);

      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant).toBeDefined();
      expect(participant!.publishedTracks).toEqual([TrackType.SCREEN_SHARE]);
      expect(participant!.screenShareStream).toEqual(mediaStream);
    });

    it('publish screen share stream with audio', async () => {
      const videoTrack = new MediaStreamTrack();
      const audioTrack = new MediaStreamTrack();
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getVideoTracks').mockReturnValue([videoTrack]);
      vi.spyOn(mediaStream, 'getAudioTracks').mockReturnValue([audioTrack]);

      await call.publishScreenShareStream(mediaStream);
      expect(publisher.publish).toHaveBeenCalledWith(
        videoTrack,
        TrackType.SCREEN_SHARE,
      );
      expect(publisher.publish).toHaveBeenCalledWith(
        audioTrack,
        TrackType.SCREEN_SHARE_AUDIO,
      );
      expect(call['trackPublishOrder']).toEqual([
        TrackType.SCREEN_SHARE,
        TrackType.SCREEN_SHARE_AUDIO,
      ]);

      expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
        { trackType: TrackType.SCREEN_SHARE, muted: false },
        { trackType: TrackType.SCREEN_SHARE_AUDIO, muted: false },
      ]);

      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant).toBeDefined();
      expect(participant!.publishedTracks).toEqual([
        TrackType.SCREEN_SHARE,
        TrackType.SCREEN_SHARE_AUDIO,
      ]);
      expect(participant!.screenShareStream).toEqual(mediaStream);
      expect(participant!.screenShareAudioStream).toEqual(mediaStream);
    });

    it('unpublish video stream', async () => {
      const mediaStream = new MediaStream();
      call.state.updateParticipant(sessionId, {
        publishedTracks: [TrackType.VIDEO, TrackType.AUDIO],
        videoStream: mediaStream,
      });
      await call.stopPublish(TrackType.VIDEO);
      expect(publisher.publish).not.toHaveBeenCalled();
      expect(publisher.stopTracks).toHaveBeenCalledWith(TrackType.VIDEO);
      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant!.publishedTracks).toEqual([TrackType.AUDIO]);
      expect(participant!.videoStream).toBeUndefined();
    });

    it('unpublish audio stream', async () => {
      const mediaStream = new MediaStream();
      call.state.updateParticipant(sessionId, {
        publishedTracks: [TrackType.VIDEO, TrackType.AUDIO],
        audioStream: mediaStream,
      });
      await call.stopPublish(TrackType.AUDIO);
      expect(publisher.publish).not.toHaveBeenCalled();
      expect(publisher.stopTracks).toHaveBeenCalledWith(TrackType.AUDIO);
      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant!.publishedTracks).toEqual([TrackType.VIDEO]);
      expect(participant!.audioStream).toBeUndefined();
    });

    it('unpublish screen share stream', async () => {
      const mediaStream = new MediaStream();
      call.state.updateParticipant(sessionId, {
        publishedTracks: [TrackType.SCREEN_SHARE, TrackType.SCREEN_SHARE_AUDIO],
        screenShareStream: mediaStream,
        screenShareAudioStream: mediaStream,
      });
      await call.stopPublish(
        TrackType.SCREEN_SHARE,
        TrackType.SCREEN_SHARE_AUDIO,
      );
      expect(publisher.publish).not.toHaveBeenCalled();
      expect(publisher.stopTracks).toHaveBeenCalledWith(
        TrackType.SCREEN_SHARE,
        TrackType.SCREEN_SHARE_AUDIO,
      );
      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant!.publishedTracks).toEqual([]);
      expect(participant!.screenShareStream).toBeUndefined();
      expect(participant!.screenShareAudioStream).toBeUndefined();
    });
  });
});
