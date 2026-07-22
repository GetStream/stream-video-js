import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
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
   * Use {@link resumeAudio} within a user gesture to unblock.
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
  );

  constructor(tracer: Tracer) {
    this.tracer = tracer;
  }

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

  dispose = () => {
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
