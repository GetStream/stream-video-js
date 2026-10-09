/**
 * @vitest-environment happy-dom
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isMediaInterrupted,
  watchMediaInterruptions,
} from '../mediaInterruptions';
import type { AudioSessionState } from '../types';

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

const installAudioSession = (initial: AudioSessionState) => {
  const session = Object.assign(new EventTarget(), {
    type: 'auto',
    state: initial,
  });
  Object.defineProperty(navigator, 'audioSession', {
    configurable: true,
    value: session,
  });
  return {
    setState: (state: AudioSessionState) => {
      session.state = state;
      session.dispatchEvent(new Event('statechange'));
    },
  };
};

describe('mediaInterruptions', () => {
  afterEach(() => {
    // @ts-expect-error restore the prototype getter
    delete document.visibilityState;
    // @ts-expect-error remove the test double
    delete navigator.audioSession;
  });

  describe('isMediaInterrupted', () => {
    it('is false while visible without an interrupted audio session', () => {
      setVisibility('visible');
      expect(isMediaInterrupted()).toBe(false);

      installAudioSession('active');
      expect(isMediaInterrupted()).toBe(false);
    });

    it('is true while the page is hidden', () => {
      setVisibility('hidden');
      expect(isMediaInterrupted()).toBe(true);
    });

    it('is true while the audio session is interrupted', () => {
      setVisibility('visible');
      installAudioSession('interrupted');
      expect(isMediaInterrupted()).toBe(true);
    });
  });

  describe('watchMediaInterruptions', () => {
    it('fires when the page becomes visible again', () => {
      setVisibility('visible');
      const onResumed = vi.fn();
      const stop = watchMediaInterruptions(onResumed);

      setVisibility('hidden');
      expect(onResumed).not.toHaveBeenCalled();
      setVisibility('visible');
      expect(onResumed).toHaveBeenCalledTimes(1);

      stop();
    });

    it('does not fire on events that do not end an interruption', () => {
      setVisibility('visible');
      const onResumed = vi.fn();
      const stop = watchMediaInterruptions(onResumed);

      setVisibility('visible');
      setVisibility('visible');

      expect(onResumed).not.toHaveBeenCalled();
      stop();
    });

    it('fires when the audio session leaves the interrupted state', () => {
      setVisibility('visible');
      const session = installAudioSession('active');
      const onResumed = vi.fn();
      const stop = watchMediaInterruptions(onResumed);

      session.setState('interrupted');
      expect(onResumed).not.toHaveBeenCalled();
      session.setState('active');
      expect(onResumed).toHaveBeenCalledTimes(1);

      stop();
    });

    it('waits until both the page is visible and the session is no longer interrupted', () => {
      setVisibility('hidden');
      const session = installAudioSession('interrupted');
      const onResumed = vi.fn();
      const stop = watchMediaInterruptions(onResumed);

      session.setState('active');
      expect(onResumed).not.toHaveBeenCalled();
      setVisibility('visible');
      expect(onResumed).toHaveBeenCalledTimes(1);

      stop();
    });

    it('stops firing once the returned cleanup is called', () => {
      setVisibility('hidden');
      const onResumed = vi.fn();
      const stop = watchMediaInterruptions(onResumed);

      stop();
      setVisibility('visible');

      expect(onResumed).not.toHaveBeenCalled();
    });
  });
});
