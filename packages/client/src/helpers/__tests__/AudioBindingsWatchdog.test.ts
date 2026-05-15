/**
 * @vitest-environment happy-dom
 */

import '../../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioBindingsWatchdog } from '../AudioBindingsWatchdog';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import { noopComparator } from '../../sorting';
import { fromPartial } from '@total-typescript/shoehorn';
import { TrackType } from '../../gen/video/sfu/models/models';

describe('AudioBindingsWatchdog', () => {
  let watchdog: AudioBindingsWatchdog;
  let call: Call;

  beforeEach(() => {
    vi.useFakeTimers();
    call = new Call({
      id: 'id',
      type: 'default',
      streamClient: new StreamClient('api-key', {
        devicePersistence: { enabled: false },
      }),
      clientStore: new StreamVideoWriteableStateStore(),
    });
    call.setSortParticipantsBy(noopComparator());
    // No-op callback: the original suite tests dangling-binding
    // diagnostics, not pause/play forwarding (covered separately below).
    watchdog = new AudioBindingsWatchdog(call.state, call.tracer, () => {});
  });

  afterEach(() => {
    watchdog.dispose();
    call.leave();
    vi.useRealTimers();
  });

  const addRemoteParticipant = (
    sessionId: string,
    userId: string,
    streams?: {
      audioStream?: MediaStream;
      screenShareAudioStream?: MediaStream;
    },
  ) => {
    const publishedTracks = [];
    if (streams?.audioStream) publishedTracks.push(TrackType.AUDIO);
    if (streams?.screenShareAudioStream) {
      publishedTracks.push(TrackType.SCREEN_SHARE_AUDIO);
    }
    call.state.updateOrAddParticipant(
      sessionId,
      fromPartial({
        userId,
        sessionId,
        publishedTracks,
        ...streams,
      }),
    );
  };

  it('should warn about dangling audio streams when active', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      audioStream: new MediaStream(),
    });

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Dangling audio bindings detected'),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('user-1'));
  });

  it('should not warn when all audio elements are bound', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      audioStream: new MediaStream(),
    });
    watchdog.register(
      document.createElement('audio'),
      'session-1',
      'audioTrack',
    );

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should skip local participant', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    // @ts-expect-error incomplete data
    call.state.updateOrAddParticipant('local-session', {
      userId: 'local-user',
      sessionId: 'local-session',
      isLocalParticipant: true,
      publishedTracks: [],
      audioStream: new MediaStream(),
    });

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should start on JOINED and stop on non-JOINED state', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      audioStream: new MediaStream(),
    });

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockClear();

    call.state.setCallingState(CallingState.IDLE);
    vi.advanceTimersByTime(6000);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should be disableable via setEnabled', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      audioStream: new MediaStream(),
    });

    watchdog.setEnabled(false);

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(6000);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should re-enable after disabling', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      audioStream: new MediaStream(),
    });

    watchdog.setEnabled(false);
    watchdog.setEnabled(true);

    vi.advanceTimersByTime(3000);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Dangling audio bindings detected'),
    );
  });

  it('should warn when binding a different element to the same key', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    const audioElement1 = document.createElement('audio');
    const audioElement2 = document.createElement('audio');

    watchdog.register(audioElement1, 'session-1', 'audioTrack');
    watchdog.register(audioElement2, 'session-1', 'audioTrack');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Audio element already bound'),
    );
  });

  it('should not warn when re-binding the same element', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    const audioElement = document.createElement('audio');

    watchdog.register(audioElement, 'session-1', 'audioTrack');
    watchdog.register(audioElement, 'session-1', 'audioTrack');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('unregisterBinding should remove the binding', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      audioStream: new MediaStream(),
    });
    watchdog.register(
      document.createElement('audio'),
      'session-1',
      'audioTrack',
    );

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);
    expect(warnSpy).not.toHaveBeenCalled();

    watchdog.unregister('session-1', 'audioTrack');
    vi.advanceTimersByTime(3000);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Dangling audio bindings detected'),
    );
  });

  it('should warn about dangling screenShareAudioStream', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      screenShareAudioStream: new MediaStream(),
    });

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Dangling audio bindings detected'),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('user-1'));
  });

  it('should not warn when audioStream exists but audio is not published', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    call.state.updateOrAddParticipant(
      'session-1',
      fromPartial({
        userId: 'user-1',
        sessionId: 'session-1',
        publishedTracks: [],
        audioStream: new MediaStream(),
      }),
    );

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should not warn when screenShareAudio element is bound', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      screenShareAudioStream: new MediaStream(),
    });
    watchdog.register(
      document.createElement('audio'),
      'session-1',
      'screenShareAudioTrack',
    );

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should warn only about the unbound track type', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      audioStream: new MediaStream(),
      screenShareAudioStream: new MediaStream(),
    });

    // bind only the regular audio track
    watchdog.register(
      document.createElement('audio'),
      'session-1',
      'audioTrack',
    );

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);

    // should still warn because screenShareAudio is unbound
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Dangling audio bindings detected'),
    );
  });

  it('should not warn when both audio and screenShareAudio are bound', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      audioStream: new MediaStream(),
      screenShareAudioStream: new MediaStream(),
    });

    watchdog.register(
      document.createElement('audio'),
      'session-1',
      'audioTrack',
    );
    watchdog.register(
      document.createElement('audio'),
      'session-1',
      'screenShareAudioTrack',
    );

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('dispose should stop the watchdog', () => {
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(watchdog.logger, 'warn');

    addRemoteParticipant('session-1', 'user-1', {
      audioStream: new MediaStream(),
    });

    call.state.setCallingState(CallingState.JOINED);
    vi.advanceTimersByTime(3000);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockClear();

    watchdog.dispose();
    vi.advanceTimersByTime(6000);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  describe('pause/play forwarding', () => {
    let onElementPausedChange: ReturnType<typeof vi.fn>;
    let watchdogWithCallback: AudioBindingsWatchdog;

    beforeEach(() => {
      onElementPausedChange = vi.fn();
      watchdogWithCallback = new AudioBindingsWatchdog(
        call.state,
        call.tracer,
        onElementPausedChange,
      );
    });

    afterEach(() => {
      watchdogWithCallback.dispose();
    });

    /** Element whose `srcObject` is a `MediaStream` with one live track. */
    const elementWithLiveStream = (): HTMLAudioElement => {
      const el = document.createElement('audio');
      const stream = new MediaStream();
      const track = new MediaStreamTrack();
      // MediaStreamTrack mock defaults `readyState: 'live'` already.
      vi.spyOn(stream, 'getTracks').mockReturnValue([track]);
      Object.defineProperty(el, 'srcObject', { writable: true });
      el.srcObject = stream;
      return el;
    };

    it('emits paused=true at register time when the element is already paused with a live srcObject', () => {
      const el = elementWithLiveStream();
      watchdogWithCallback.register(el, 'session-1', 'audioTrack');
      expect(onElementPausedChange).toHaveBeenCalledWith(el, true);
      expect(onElementPausedChange).toHaveBeenCalledTimes(1);
    });

    it('emits paused=true on `pause` when srcObject is a live MediaStream', () => {
      const el = elementWithLiveStream();
      watchdogWithCallback.register(el, 'session-1', 'audioTrack');
      // `register()` proactively forwards already-paused-live elements;
      // clear so this case strictly exercises the `pause` event listener.
      onElementPausedChange.mockClear();
      el.dispatchEvent(new Event('pause'));
      expect(onElementPausedChange).toHaveBeenCalledWith(el, true);
      expect(onElementPausedChange).toHaveBeenCalledTimes(1);
    });

    it('emits paused=true on `suspend` when srcObject is a live MediaStream', () => {
      const el = elementWithLiveStream();
      watchdogWithCallback.register(el, 'session-1', 'audioTrack');
      onElementPausedChange.mockClear();
      el.dispatchEvent(new Event('suspend'));
      expect(onElementPausedChange).toHaveBeenCalledWith(el, true);
      expect(onElementPausedChange).toHaveBeenCalledTimes(1);
    });

    it('does NOT emit on `pause` when srcObject is null (benign unbind)', () => {
      const el = document.createElement('audio');
      Object.defineProperty(el, 'srcObject', { writable: true });
      el.srcObject = null;
      watchdogWithCallback.register(el, 'session-1', 'audioTrack');
      el.dispatchEvent(new Event('pause'));
      expect(onElementPausedChange).not.toHaveBeenCalled();
    });

    it('does NOT emit on `suspend` when srcObject is null (benign unbind)', () => {
      const el = document.createElement('audio');
      Object.defineProperty(el, 'srcObject', { writable: true });
      el.srcObject = null;
      watchdogWithCallback.register(el, 'session-1', 'audioTrack');
      el.dispatchEvent(new Event('suspend'));
      expect(onElementPausedChange).not.toHaveBeenCalled();
    });

    it('does NOT emit on `pause` when every track in srcObject is ended', () => {
      const el = document.createElement('audio');
      const stream = new MediaStream();
      const endedTrack = new MediaStreamTrack();
      // @ts-expect-error - mocked override
      endedTrack.readyState = 'ended';
      vi.spyOn(stream, 'getTracks').mockReturnValue([endedTrack]);
      Object.defineProperty(el, 'srcObject', { writable: true });
      el.srcObject = stream;

      watchdogWithCallback.register(el, 'session-1', 'audioTrack');
      el.dispatchEvent(new Event('pause'));
      expect(onElementPausedChange).not.toHaveBeenCalled();
    });

    it('does NOT emit on `suspend` when every track in srcObject is ended', () => {
      const el = document.createElement('audio');
      const stream = new MediaStream();
      const endedTrack = new MediaStreamTrack();
      // @ts-expect-error - mocked override
      endedTrack.readyState = 'ended';
      vi.spyOn(stream, 'getTracks').mockReturnValue([endedTrack]);
      Object.defineProperty(el, 'srcObject', { writable: true });
      el.srcObject = stream;

      watchdogWithCallback.register(el, 'session-1', 'audioTrack');
      el.dispatchEvent(new Event('suspend'));
      expect(onElementPausedChange).not.toHaveBeenCalled();
    });

    it('emits paused=false on `play`', () => {
      const el = elementWithLiveStream();
      watchdogWithCallback.register(el, 'session-1', 'audioTrack');

      el.dispatchEvent(new Event('pause'));
      expect(onElementPausedChange).toHaveBeenLastCalledWith(el, true);

      el.dispatchEvent(new Event('play'));
      expect(onElementPausedChange).toHaveBeenLastCalledWith(el, false);
    });

    it('unregister detaches listeners and emits a final paused=false', () => {
      const el = elementWithLiveStream();
      watchdogWithCallback.register(el, 'session-1', 'audioTrack');
      el.dispatchEvent(new Event('pause'));
      expect(onElementPausedChange).toHaveBeenLastCalledWith(el, true);

      watchdogWithCallback.unregister('session-1', 'audioTrack');
      // Defensive emit on the way out so a downstream consumer can't
      // stay stuck holding a paused-state report for an element that's
      // no longer bound.
      expect(onElementPausedChange).toHaveBeenLastCalledWith(el, false);

      // Listeners detached: subsequent pause/suspend does not fire forwarding.
      onElementPausedChange.mockClear();
      el.dispatchEvent(new Event('pause'));
      el.dispatchEvent(new Event('suspend'));
      expect(onElementPausedChange).not.toHaveBeenCalled();
    });

    it('rebinding a different element clears the old element paused-state', () => {
      const oldEl = elementWithLiveStream();
      watchdogWithCallback.register(oldEl, 'session-1', 'audioTrack');
      oldEl.dispatchEvent(new Event('pause'));
      expect(onElementPausedChange).toHaveBeenLastCalledWith(oldEl, true);

      const newEl = elementWithLiveStream();
      onElementPausedChange.mockClear();
      watchdogWithCallback.register(newEl, 'session-1', 'audioTrack');

      // Old element's stale paused=true must be cleared so downstream
      // audio-health doesn't stay unhealthy waiting for newEl to fire `play`.
      expect(onElementPausedChange).toHaveBeenCalledWith(oldEl, false);
    });
  });
});
