import { VideoApi } from '../gen/coordinator/video/VideoApi';
import { ApiClient } from '../coordinator/connection/api-client';
import '../rtc/__tests__/mocks/webrtc.mocks';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { Publisher, Subscriber } from '../rtc';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { PermissionsContext } from '../permissions';
import { OwnCapability } from '../gen/coordinator';
import { CallingState, ClientState } from '../store';
import { TrackType } from '../gen/video/sfu/models/models';
import { StreamSfuClient } from '../StreamSfuClient';
import { promiseWithResolvers } from '../helpers/promise';

describe('Publishing and Unpublishing tracks', () => {
  let call: Call;

  beforeEach(async () => {
    const streamClient = new StreamClient('abc');
    call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      videoApi: new VideoApi(new ApiClient(streamClient)),
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientState: new ClientState(),
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
      const err = 'Call is not joined yet';
      await expect(call.publish(ms, TrackType.VIDEO)).rejects.toThrowError(err);
      await expect(call.publish(ms, TrackType.AUDIO)).rejects.toThrowError(err);
      await expect(
        call.publish(ms, TrackType.SCREEN_SHARE),
      ).rejects.toThrowError(err);
    });

    it('publishing is not allowed when permissions are not set', async () => {
      // @ts-expect-error sfuClient is private
      call['sfuClient'] = {};

      call['permissionsContext'].setPermissions([]);

      const ms = new MediaStream();
      await expect(call.publish(ms, TrackType.VIDEO)).rejects.toThrowError(
        `No permission to publish VIDEO`,
      );
      await expect(call.publish(ms, TrackType.AUDIO)).rejects.toThrowError(
        'No permission to publish AUDIO',
      );
      await expect(
        call.publish(ms, TrackType.SCREEN_SHARE),
      ).rejects.toThrowError('No permission to publish SCREEN_SHARE');
    });

    it('publishing is not allowed when the publisher is not initialized', async () => {
      // @ts-expect-error sfuClient is private
      call['sfuClient'] = {};

      const ms = new MediaStream();
      await expect(call.publish(ms, TrackType.VIDEO)).rejects.toThrowError(
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

      await expect(call.publish(ms, TrackType.VIDEO)).rejects.toThrowError(
        'There is no VIDEO track in the stream',
      );
      await expect(call.publish(ms, TrackType.AUDIO)).rejects.toThrowError(
        'There is no AUDIO track in the stream',
      );
      await expect(
        call.publish(ms, TrackType.SCREEN_SHARE),
      ).rejects.toThrowError('There is no SCREEN_SHARE track in the stream');
    });

    it('publishing is not allowed when the track ended', async () => {
      // @ts-expect-error sfuClient is private
      call['sfuClient'] = {};
      // @ts-expect-error publisher is private
      call['publisher'] = {};

      const ms = new MediaStream();
      const track = new MediaStreamTrack();
      vi.spyOn(ms, 'getVideoTracks').mockReturnValue([track]);
      vi.spyOn(track, 'readyState', 'get').mockReturnValue('ended');

      await expect(call.publish(ms, TrackType.VIDEO)).rejects.toThrowError(
        `Can't publish ended tracks.`,
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
      call.state.setCallingState(CallingState.JOINED);
    });

    it('publish video stream', async () => {
      const track = new MediaStreamTrack();
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getVideoTracks').mockReturnValue([track]);

      await call.publish(mediaStream, TrackType.VIDEO);
      expect(publisher.publish).toHaveBeenCalledWith(
        track,
        TrackType.VIDEO,
        undefined,
      );
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

      await call.publish(mediaStream, TrackType.AUDIO);
      expect(publisher.publish).toHaveBeenCalledWith(
        track,
        TrackType.AUDIO,
        undefined,
      );
      expect(call['trackPublishOrder']).toEqual([TrackType.AUDIO]);

      expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
        { trackType: TrackType.AUDIO, muted: false },
      ]);

      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant).toBeDefined();
      expect(participant!.publishedTracks).toEqual([TrackType.AUDIO]);
      expect(participant!.audioStream).toEqual(mediaStream);
    });

    it('keeps a stream the SFU already echoed back instead of the capture one', async () => {
      // `allowOwnTracksLoopback`: the echo can land on the participant before
      // publishing gets to write the capture stream to the same field.
      const echoedStream = new MediaStream();
      call.subscriber = {
        isSelfSubscribedStream: (stream: MediaStream | undefined) =>
          stream === echoedStream,
      } as unknown as Subscriber;
      call.state.updateParticipant(sessionId, { audioStream: echoedStream });

      const track = new MediaStreamTrack();
      const captureStream = new MediaStream();
      vi.spyOn(captureStream, 'getAudioTracks').mockReturnValue([track]);

      await call.publish(captureStream, TrackType.AUDIO);

      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant!.publishedTracks).toEqual([TrackType.AUDIO]);
      expect(participant!.audioStream).toBe(echoedStream);
    });

    it('keeps an echoed stream when the track is unpublished', async () => {
      // a device switch unpublishes and republishes; the echoed track goes
      // briefly silent but is never replaced, so the reference has to survive
      const echoedStream = new MediaStream();
      call.subscriber = {
        isSelfSubscribedStream: (stream: MediaStream | undefined) =>
          stream === echoedStream,
      } as unknown as Subscriber;
      call.state.updateParticipant(sessionId, {
        audioStream: echoedStream,
        publishedTracks: [TrackType.AUDIO],
      });

      await call.stopPublish(TrackType.AUDIO);

      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant!.publishedTracks).toEqual([]);
      expect(participant!.audioStream).toBe(echoedStream);
    });

    it('publish screen share stream', async () => {
      const track = new MediaStreamTrack();
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getVideoTracks').mockReturnValue([track]);

      await call.publish(mediaStream, TrackType.SCREEN_SHARE);
      expect(publisher.publish).toHaveBeenCalledWith(
        track,
        TrackType.SCREEN_SHARE,
        undefined,
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

      await call.publish(mediaStream, TrackType.SCREEN_SHARE);
      expect(publisher.publish).toHaveBeenCalledWith(
        videoTrack,
        TrackType.SCREEN_SHARE,
        undefined,
      );
      expect(publisher.publish).toHaveBeenCalledWith(
        audioTrack,
        TrackType.SCREEN_SHARE_AUDIO,
        undefined,
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
      expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
        { trackType: TrackType.VIDEO, muted: true },
      ]);
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

    it('does not throw if sfuClient is cleared while the mute-state RPC is in flight', async () => {
      let releaseMuteUpdate!: () => void;
      let signalMuteUpdateEntered!: () => void;
      const muteUpdateEntered = new Promise<void>(
        (resolve) => (signalMuteUpdateEntered = resolve),
      );
      sfuClient.updateMuteStates = vi.fn().mockImplementation(() => {
        signalMuteUpdateEntered();
        return new Promise<void>((resolve) => (releaseMuteUpdate = resolve));
      });

      const track = new MediaStreamTrack() as MediaStreamAudioTrack;
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getAudioTracks').mockReturnValue([track]);

      const inflight = call.publish(mediaStream, TrackType.AUDIO);

      await muteUpdateEntered;

      call['sfuClient'] = undefined;
      releaseMuteUpdate();

      await inflight;
    });

    it('updates local stream state when sfuClient is replaced with the same session id', async () => {
      let releaseMuteUpdate!: () => void;
      let signalMuteUpdateEntered!: () => void;
      const muteUpdateEntered = new Promise<void>(
        (resolve) => (signalMuteUpdateEntered = resolve),
      );
      sfuClient.updateMuteStates = vi.fn().mockImplementation(() => {
        signalMuteUpdateEntered();
        return new Promise<void>((resolve) => (releaseMuteUpdate = resolve));
      });

      const track = new MediaStreamTrack() as MediaStreamAudioTrack;
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getAudioTracks').mockReturnValue([track]);

      const inflight = call.publish(mediaStream, TrackType.AUDIO);

      await muteUpdateEntered;

      const replacementSfuClient = vi.fn() as unknown as StreamSfuClient;
      // @ts-expect-error sessionId is readonly
      replacementSfuClient['sessionId'] = sessionId;
      replacementSfuClient.updateMuteStates = vi.fn();
      call['sfuClient'] = replacementSfuClient;
      releaseMuteUpdate();

      await inflight;

      const participant = call.state.findParticipantBySessionId(sessionId);
      expect(participant?.publishedTracks).toEqual([TrackType.AUDIO]);
      expect(participant?.audioStream).toBe(mediaStream);
    });

    it('skips local stream state update when sfuClient is replaced with a new session id', async () => {
      let releaseMuteUpdate!: () => void;
      let signalMuteUpdateEntered!: () => void;
      const muteUpdateEntered = new Promise<void>(
        (resolve) => (signalMuteUpdateEntered = resolve),
      );
      sfuClient.updateMuteStates = vi.fn().mockImplementation(() => {
        signalMuteUpdateEntered();
        return new Promise<void>((resolve) => (releaseMuteUpdate = resolve));
      });

      const track = new MediaStreamTrack() as MediaStreamAudioTrack;
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getAudioTracks').mockReturnValue([track]);

      const inflight = call.publish(mediaStream, TrackType.AUDIO);

      await muteUpdateEntered;

      const replacementSessionId = 'replacement-session-id';
      // @ts-expect-error partial data
      call.state.updateOrAddParticipant(replacementSessionId, {
        sessionId: replacementSessionId,
        publishedTracks: [],
      });

      const replacementSfuClient = vi.fn() as unknown as StreamSfuClient;
      // @ts-expect-error sessionId is readonly
      replacementSfuClient['sessionId'] = replacementSessionId;
      replacementSfuClient.updateMuteStates = vi.fn();
      call['sfuClient'] = replacementSfuClient;
      releaseMuteUpdate();

      await inflight;

      const originalParticipant =
        call.state.findParticipantBySessionId(sessionId);
      const replacementParticipant =
        call.state.findParticipantBySessionId(replacementSessionId);
      expect(originalParticipant?.publishedTracks).toEqual([]);
      expect(originalParticipant?.audioStream).toBeUndefined();
      expect(replacementParticipant?.publishedTracks).toEqual([]);
      expect(replacementParticipant?.audioStream).toBeUndefined();
    });

    describe('while reconnecting', () => {
      const internals = () =>
        call as unknown as {
          doJoin: () => Promise<void>;
          reconnectFast: () => Promise<void>;
          reconnectRejoin: () => Promise<void>;
          restorePublishedTracks: () => Promise<void>;
          syncPublishedTracks: () => void;
        };

      beforeEach(() => {
        publisher.isPublishing = vi.fn(() => false);
        for (const device of [call.microphone, call.camera, call.screenShare]) {
          vi.spyOn(device, 'syncPublishedStream').mockResolvedValue();
        }
        call.state.setCallingState(CallingState.RECONNECTING);
      });

      it('stops the published tracks without sending the mute state', async () => {
        const mediaStream = new MediaStream();
        call.state.updateParticipant(sessionId, {
          publishedTracks: [TrackType.SCREEN_SHARE, TrackType.AUDIO],
          screenShareStream: mediaStream,
        });

        await call.stopPublish(
          TrackType.SCREEN_SHARE,
          TrackType.SCREEN_SHARE_AUDIO,
        );

        expect(publisher.stopTracks).toHaveBeenCalledWith(
          TrackType.SCREEN_SHARE,
          TrackType.SCREEN_SHARE_AUDIO,
        );
        expect(sfuClient.updateMuteStates).not.toHaveBeenCalled();
        const participant = call.state.findParticipantBySessionId(sessionId);
        expect(participant!.publishedTracks).toEqual([TrackType.AUDIO]);
        expect(participant!.screenShareStream).toBeUndefined();
      });

      it('sends the deferred mute state once synced', async () => {
        await call.stopPublish(TrackType.VIDEO);
        call.state.setCallingState(CallingState.JOINED);

        internals().syncPublishedTracks();
        await vi.waitFor(() =>
          expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
            { trackType: TrackType.VIDEO, muted: true },
          ]),
        );
        expect(call.camera.syncPublishedStream).toHaveBeenCalled();

        internals().syncPublishedTracks();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(sfuClient.updateMuteStates).toHaveBeenCalledTimes(1);
      });

      it('keeps the deferred mute state when the call is not joined', async () => {
        await call.stopPublish(TrackType.VIDEO);

        internals().syncPublishedTracks();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(sfuClient.updateMuteStates).not.toHaveBeenCalled();

        call.state.setCallingState(CallingState.JOINED);
        internals().syncPublishedTracks();
        await vi.waitFor(() =>
          expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
            { trackType: TrackType.VIDEO, muted: true },
          ]),
        );
      });

      it('sends the deferred mute state even if a restore published again', async () => {
        await call.stopPublish(TrackType.VIDEO);
        call.state.setCallingState(CallingState.JOINED);
        const mediaStream = new MediaStream();
        vi.spyOn(mediaStream, 'getVideoTracks').mockReturnValue([
          new MediaStreamTrack(),
        ]);
        // a restore that attached a clone the device then stopped
        await call.publish(mediaStream, TrackType.VIDEO);

        internals().syncPublishedTracks();
        await vi.waitFor(() =>
          expect(sfuClient.updateMuteStates).toHaveBeenLastCalledWith([
            { trackType: TrackType.VIDEO, muted: true },
          ]),
        );
      });

      it('skips the mute state of a track published again', async () => {
        await call.stopPublish(TrackType.VIDEO);
        call.state.setCallingState(CallingState.JOINED);
        vi.mocked(publisher.isPublishing).mockReturnValue(true);

        internals().syncPublishedTracks();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(sfuClient.updateMuteStates).not.toHaveBeenCalled();
      });

      it('does not wait for a device that has not settled', async () => {
        const { promise, resolve } = promiseWithResolvers<void>();
        vi.mocked(call.screenShare.syncPublishedStream).mockReturnValue(
          promise,
        );
        await call.stopPublish(TrackType.VIDEO);
        call.state.setCallingState(CallingState.JOINED);

        internals().syncPublishedTracks();
        await vi.waitFor(() =>
          expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
            { trackType: TrackType.VIDEO, muted: true },
          ]),
        );
        resolve();
      });

      it('syncs the published tracks after a fast reconnect', async () => {
        vi.spyOn(internals(), 'doJoin').mockResolvedValue();
        vi.spyOn(call, 'get').mockResolvedValue(
          {} as Awaited<ReturnType<Call['get']>>,
        );
        const sync = vi.spyOn(internals(), 'syncPublishedTracks');

        await internals().reconnectFast();

        expect(sync).toHaveBeenCalled();
      });

      it('syncs the published tracks after a migration', async () => {
        sfuClient.enterMigration = vi.fn().mockResolvedValue(undefined);
        sfuClient.close = vi.fn();
        publisher.detachEventHandlers = vi.fn();
        publisher.dispose = vi.fn().mockResolvedValue(undefined);
        const reconnectMigrate = (
          call as unknown as { reconnectMigrate: () => Promise<void> }
        ).reconnectMigrate;
        vi.spyOn(internals(), 'doJoin').mockResolvedValue();
        vi.spyOn(internals(), 'restorePublishedTracks').mockResolvedValue();
        const sync = vi.spyOn(internals(), 'syncPublishedTracks');

        await reconnectMigrate();

        expect(sync).toHaveBeenCalled();
        expect(call.state.callingState).toBe(CallingState.JOINED);
      });

      it('drops the deferred mute state on a rejoin', async () => {
        await call.stopPublish(TrackType.VIDEO);
        vi.spyOn(internals(), 'doJoin').mockImplementation(async () => {
          call.state.setCallingState(CallingState.JOINED);
        });
        vi.spyOn(internals(), 'restorePublishedTracks').mockResolvedValue();

        await internals().reconnectRejoin();
        internals().syncPublishedTracks();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(sfuClient.updateMuteStates).not.toHaveBeenCalled();
      });
    });
  });
});
