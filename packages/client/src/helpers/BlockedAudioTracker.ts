import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { setCurrentValue, setCurrentValueAsync } from '../store/rxUtils';
import { timeboxed } from '../coordinator/connection/utils';

/**
 * Tracks audio elements that the browser's autoplay policy has blocked.
 */
export class BlockedAudioTracker {
  private logger = videoLoggerSystem.getLogger('BlockedAudioTracker');
  private tracer: Tracer;

  private blockedElementsSubject = new BehaviorSubject(
    new Set<HTMLAudioElement>(),
  );

  /**
   * Whether the browser's autoplay policy is blocking audio playback.
   * Will be `true` when at least one audio element is currently blocked.
   * Use {@link resumeAudio} within a user gesture to unblock.
   */
  autoplayBlocked$ = this.blockedElementsSubject.pipe(
    map((elements) => elements.size > 0),
    distinctUntilChanged(),
  );

  constructor(tracer: Tracer) {
    this.tracer = tracer;
  }

  /**
   * Registers an audio element as blocked by the browser's autoplay policy.
   */
  markBlocked = (audioElement: HTMLAudioElement, blocked: boolean) => {
    setCurrentValue(this.blockedElementsSubject, (elements) => {
      if (blocked) elements.add(audioElement);
      else elements.delete(audioElement);
      return elements;
    });
  };

  /**
   * Returns whether the given audio element is currently flagged as blocked
   * by the browser's autoplay policy.
   */
  isBlocked = (audioElement: HTMLAudioElement): boolean => {
    return this.blockedElementsSubject.getValue().has(audioElement);
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
        await Promise.all(
          Array.from(elements, async (element) => {
            try {
              if (element.srcObject) await timeboxed([element.play()], 2000);
              elements.delete(element);
            } catch (err) {
              this.logger.warn(`Can't resume audio for element`, element, err);
            }
          }),
        );
        return elements;
      },
    );
  };
}
