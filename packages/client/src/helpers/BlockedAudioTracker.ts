import { BehaviorSubject, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import {
  isShallowArrayEqual,
  setCurrentValue,
  setCurrentValueAsync,
} from '../store/rxUtils';
import { timeboxed } from '../coordinator/connection/utils';

type BlockedAudioElement = {
  element: HTMLAudioElement;
  sessionId?: string;
};

/**
 * Tracks audio elements that the browser's autoplay policy has blocked.
 */
export class BlockedAudioTracker {
  private logger = videoLoggerSystem.getLogger('BlockedAudioTracker');
  private tracer: Tracer;

  private blockedElementsSubject = new BehaviorSubject<BlockedAudioElement[]>(
    [],
  );

  /**
   * Whether the browser's autoplay policy is blocking audio playback.
   * Will be `true` when at least one audio element is currently blocked.
   * Use {@link resumeAudio} within a user gesture to unblock. Any click or
   * key press on the page unblocks it as well.
   */
  autoplayBlocked$ = this.blockedElementsSubject.pipe(
    map((elements) => elements.length > 0),
    distinctUntilChanged(),
  );

  /**
   * The list of participant `sessionId`s whose audio element is currently
   * blocked by the browser's autoplay policy. Only some participants may be
   * blocked (e.g. one joined while a gesture was active and a later one was
   * not), so use this to render a per-participant affordance rather than a
   * call-wide one. Call {@link resumeAudio} within a user gesture to unblock
   * all of them.
   *
   * Session ids are registered together with the audio element.
   */
  blockedSessionIds$ = this.blockedElementsSubject.pipe(
    map((elements) => {
      const ids: string[] = [];
      elements.forEach(({ sessionId }) => {
        if (sessionId && !ids.includes(sessionId)) ids.push(sessionId);
      });
      return ids;
    }),
    distinctUntilChanged(isShallowArrayEqual),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(tracer: Tracer) {
    this.tracer = tracer;
    this.autoplayBlocked$.subscribe(this.toggleResumeOnGesture);
  }

  /**
   * While audio is blocked, any user gesture on the page resumes it.
   * WebKit keeps an element whose play() was rejected restricted until it
   * is played from within a gesture, even after the page had interactions.
   */
  private toggleResumeOnGesture = (blocked: boolean) => {
    if (typeof document === 'undefined') return;
    for (const type of ['click', 'keydown'] as const) {
      if (blocked) {
        document.addEventListener(type, this.resumeOnGesture, true);
      } else {
        document.removeEventListener(type, this.resumeOnGesture, true);
      }
    }
  };

  private resumeOnGesture = () => {
    this.resumeAudio().catch((err) => {
      this.logger.warn(`Can't resume audio on user gesture`, err);
    });
  };

  /**
   * Registers an audio element as blocked by the browser's autoplay policy.
   */
  markBlocked = (
    audioElement: HTMLAudioElement,
    blocked: boolean,
    sessionId?: string,
  ) => {
    setCurrentValue(this.blockedElementsSubject, (elements) => {
      if (!blocked) {
        return elements.filter(({ element }) => element !== audioElement);
      }

      const existing = elements.find(({ element }) => element === audioElement);
      if (existing) {
        return elements.map((entry) =>
          entry.element === audioElement
            ? { element: audioElement, sessionId: sessionId ?? entry.sessionId }
            : entry,
        );
      }

      return [...elements, { element: audioElement, sessionId }];
    });
  };

  /**
   * Clears all tracked elements. The tracker stays usable afterwards.
   */
  reset = () => {
    if (this.blockedElementsSubject.getValue().length > 0) {
      this.blockedElementsSubject.next([]);
    }
  };

  /**
   * Returns whether the given audio element is currently flagged as blocked
   * by the browser's autoplay policy.
   */
  isBlocked = (audioElement: HTMLAudioElement): boolean => {
    return this.blockedElementsSubject
      .getValue()
      .some(({ element }) => element === audioElement);
  };

  /**
   * Plays all audio elements blocked by the browser's autoplay policy.
   * Must be called from within a user gesture (e.g., click handler).
   */
  resumeAudio = async () => {
    this.tracer.trace('resumeAudio', null);
    await setCurrentValueAsync(
      this.blockedElementsSubject,
      async (elements) => {
        let next = elements;
        await Promise.all(
          elements.map(async ({ element }) => {
            try {
              if (element.srcObject) await timeboxed([element.play()], 2000);
              next = next.filter((entry) => entry.element !== element);
            } catch (err) {
              this.logger.warn(`Can't resume audio for element`, element, err);
            }
          }),
        );
        return next;
      },
    );
  };
}
