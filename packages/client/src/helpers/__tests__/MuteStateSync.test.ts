import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { MuteStateSync } from '../MuteStateSync';
import { CallingState, CallState } from '../../store';
import { TrackType } from '../../gen/video/sfu/models/models';
import type { StreamSfuClient } from '../../StreamSfuClient';
import { promiseWithResolvers } from '../promise';

describe('MuteStateSync', () => {
  let state: CallState;
  let sfuClient: StreamSfuClient | undefined;
  let isPublishing: ReturnType<typeof vi.fn<(t: TrackType) => boolean>>;
  let sync: MuteStateSync;

  const createSfuClient = (sessionId: string) =>
    fromPartial<StreamSfuClient>({
      sessionId,
      updateMuteStates: vi.fn().mockResolvedValue(undefined),
    });

  beforeEach(() => {
    state = new CallState();
    state.setCallingState(CallingState.JOINED);
    sfuClient = createSfuClient('session-1');
    isPublishing = vi.fn<(t: TrackType) => boolean>(() => true);
    sync = new MuteStateSync(
      'default:test',
      state,
      () => sfuClient,
      isPublishing,
    );
  });

  it('sends the mute state right away while joined', async () => {
    await sync.notify(true, TrackType.AUDIO);

    expect(sfuClient!.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.AUDIO, muted: true },
    ]);
  });

  it('does nothing without an SFU client', async () => {
    const client = sfuClient!;
    sfuClient = undefined;
    await sync.notify(true, TrackType.AUDIO);
    sfuClient = client;
    await sync.flush();

    expect(client.updateMuteStates).not.toHaveBeenCalled();
  });

  it('keeps the latest mute state while not joined and sends it on flush', async () => {
    state.setCallingState(CallingState.RECONNECTING);
    await sync.notify(true, TrackType.VIDEO);
    await sync.notify(false, TrackType.VIDEO);
    await sync.notify(true, TrackType.AUDIO);
    expect(sfuClient!.updateMuteStates).not.toHaveBeenCalled();

    await sync.flush();
    expect(sfuClient!.updateMuteStates).not.toHaveBeenCalled();

    state.setCallingState(CallingState.JOINED);
    await sync.flush();
    expect(sfuClient!.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.AUDIO, muted: true },
    ]);
    expect(sfuClient!.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.VIDEO, muted: false },
    ]);

    await sync.flush();
    expect(sfuClient!.updateMuteStates).toHaveBeenCalledTimes(2);
  });

  it('flushes only the given track types', async () => {
    state.setCallingState(CallingState.RECONNECTING);
    await sync.notify(
      true,
      TrackType.SCREEN_SHARE,
      TrackType.SCREEN_SHARE_AUDIO,
    );
    await sync.notify(true, TrackType.VIDEO);
    state.setCallingState(CallingState.JOINED);

    await sync.flush(TrackType.SCREEN_SHARE, TrackType.SCREEN_SHARE_AUDIO);
    expect(sfuClient!.updateMuteStates).toHaveBeenCalledTimes(1);
    expect(sfuClient!.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.SCREEN_SHARE, muted: true },
      { trackType: TrackType.SCREEN_SHARE_AUDIO, muted: true },
    ]);

    await sync.flush(TrackType.VIDEO);
    expect(sfuClient!.updateMuteStates).toHaveBeenLastCalledWith([
      { trackType: TrackType.VIDEO, muted: true },
    ]);
  });

  it('sends a kept unmuted state as muted when the track is no longer published', async () => {
    state.setCallingState(CallingState.MIGRATING);
    await sync.notify(false, TrackType.VIDEO);
    isPublishing.mockReturnValue(false);
    state.setCallingState(CallingState.JOINED);

    await sync.flush();
    expect(sfuClient!.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.VIDEO, muted: true },
    ]);
  });

  it('drops the kept state once sent while joined', async () => {
    state.setCallingState(CallingState.RECONNECTING);
    await sync.notify(true, TrackType.VIDEO);
    state.setCallingState(CallingState.JOINED);
    await sync.notify(false, TrackType.VIDEO);

    await sync.flush();
    expect(sfuClient!.updateMuteStates).toHaveBeenCalledTimes(1);
    expect(sfuClient!.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.VIDEO, muted: false },
    ]);
  });

  it('drops the kept state of a previous session', async () => {
    state.setCallingState(CallingState.RECONNECTING);
    await sync.notify(true, TrackType.VIDEO);
    sfuClient = createSfuClient('session-2');
    state.setCallingState(CallingState.JOINED);

    await sync.flush();
    expect(sfuClient.updateMuteStates).not.toHaveBeenCalled();
  });

  it('keeps a state whose request failed for the next flush', async () => {
    vi.mocked(sfuClient!.updateMuteStates).mockRejectedValue(
      new Error('closed'),
    );
    await expect(sync.notify(true, TrackType.VIDEO)).rejects.toThrow();

    sfuClient = createSfuClient('session-1');
    await sync.flush();
    expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.VIDEO, muted: true },
    ]);
  });

  it('resends a failed state when the call reconnected before it failed', async () => {
    const request = promiseWithResolvers<void>();
    vi.mocked(sfuClient!.updateMuteStates).mockReturnValue(request.promise);
    const notified = sync.notify(true, TrackType.VIDEO);
    await vi.waitFor(() =>
      expect(sfuClient!.updateMuteStates).toHaveBeenCalled(),
    );

    sfuClient = createSfuClient('session-1');
    request.reject(new Error('closed'));
    await notified;
    expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.VIDEO, muted: true },
    ]);
  });

  it('does not keep a failed state replaced by a newer one', async () => {
    const request = promiseWithResolvers<void>();
    vi.mocked(sfuClient!.updateMuteStates).mockReturnValue(request.promise);
    const notified = sync.notify(true, TrackType.VIDEO);
    await vi.waitFor(() =>
      expect(sfuClient!.updateMuteStates).toHaveBeenCalled(),
    );

    state.setCallingState(CallingState.RECONNECTING);
    await sync.notify(false, TrackType.VIDEO);
    request.reject(new Error('closed'));
    await expect(notified).rejects.toThrow();

    sfuClient = createSfuClient('session-1');
    state.setCallingState(CallingState.JOINED);
    await sync.flush();
    expect(sfuClient.updateMuteStates).toHaveBeenCalledTimes(1);
    expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.VIDEO, muted: false },
    ]);
  });

  it('drops a failed state once the session changed', async () => {
    const request = promiseWithResolvers<void>();
    vi.mocked(sfuClient!.updateMuteStates).mockReturnValue(request.promise);
    const notified = sync.notify(true, TrackType.VIDEO);
    await vi.waitFor(() =>
      expect(sfuClient!.updateMuteStates).toHaveBeenCalled(),
    );

    sfuClient = createSfuClient('session-2');
    request.reject(new Error('closed'));
    await expect(notified).rejects.toThrow();

    await sync.flush();
    expect(sfuClient.updateMuteStates).not.toHaveBeenCalled();
  });

  it('keeps the state across SFU clients of the same session', async () => {
    state.setCallingState(CallingState.RECONNECTING);
    await sync.notify(true, TrackType.VIDEO);
    sfuClient = createSfuClient('session-1');
    state.setCallingState(CallingState.JOINED);

    await sync.flush();
    expect(sfuClient.updateMuteStates).toHaveBeenCalledWith([
      { trackType: TrackType.VIDEO, muted: true },
    ]);
  });
});
