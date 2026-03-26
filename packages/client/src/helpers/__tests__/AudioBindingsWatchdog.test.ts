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
    watchdog = new AudioBindingsWatchdog(call.state, call.tracer);
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
    call.state.updateOrAddParticipant(
      sessionId,
      fromPartial({
        userId,
        sessionId,
        publishedTracks: [],
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

    call.state.setCallingState(CallingState.LEFT);
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
});
