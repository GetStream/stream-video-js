import { isIOS, isSafari } from './browsers';
import { sharedAudioContext } from './SharedAudioContext';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';

/**
 * Keeps a silent, MediaStream-backed `<audio>` element playing in WebKit
 * (iOS and desktop Safari).
 *
 * WebKit lets a MediaStream-backed media element start playing without a
 * user gesture only while the page captures the mic or camera, or already
 * plays audio. Muting stops the mic track, so once the short user-activation
 * window lapses, a remote participant who joins later stays silent until
 * the user taps the page. A playing silent element keeps the page in the
 * "already playing audio" state, so remote audio keeps autoplaying.
 *
 * On desktop Safari the remote elements are created after the join's
 * gesture has expired, so the same element keeps them autoplaying; the tab
 * then shows as playing audio for the whole call. The element only does
 * what it is told: its owner decides when it plays, from page visibility,
 * user gestures and interruptions.
 */
export class SilentAudioPlayer {
  private logger = videoLoggerSystem.getLogger('SilentAudioPlayer');
  private tracer: Tracer;
  private element: HTMLAudioElement | undefined;
  private context: AudioContext | undefined;
  private releaseContext: (() => void) | undefined;
  private stream: MediaStream | undefined;
  private stopOscillator: (() => void) | undefined;
  private held = false;

  constructor(tracer: Tracer) {
    this.tracer = tracer;
  }

  /**
   * Starts the silent element, or resumes it if it was paused.
   * Succeeds only while WebKit permits playback: within a user gesture,
   * while capturing, or while other audio is playing. Otherwise it is a
   * no-op until the next call. Does nothing outside WebKit.
   */
  play = () => {
    if (!(isIOS() || isSafari()) || typeof AudioContext === 'undefined') {
      return;
    }
    this.element ??= this.create();
    this.resume();
  };

  /**
   * Resumes the silent element if {@link play} created it and it is paused.
   * Does nothing before {@link play}, after {@link dispose}, during a
   * {@link hold} or while the page is hidden.
   */
  resume = () => {
    if (!this.element || this.held || document.hidden) return;
    if (this.context?.state === 'closed') {
      this.tracer.trace('silentAudio.recreate', null);
      this.dispose();
      this.element = this.create();
    }
    const element = this.element;
    if (!element || !element.paused) return;
    element.srcObject = this.stream ?? null;
    element.play().then(
      () => this.tracer.trace('silentAudio.playing', null),
      (err) => {
        this.tracer.trace('silentAudio.playError', err?.name);
        this.logger.debug('Silent audio playback rejected', err);
      },
    );
  };

  /**
   * Pauses the element, e.g. while the page is hidden. Its source is
   * detached so iOS shows no lock screen controls for it.
   */
  pause = () => {
    if (!this.element) return;
    this.element.pause();
    this.element.srcObject = null;
  };

  /**
   * Pauses the element until {@link release}, which nothing else undoes.
   */
  hold = () => {
    this.held = true;
    this.element?.pause();
  };

  /**
   * Ends a {@link hold}. The element stays paused until {@link resume}.
   */
  release = () => {
    this.held = false;
  };

  /**
   * Stops playback and releases the element and its audio context.
   */
  dispose = () => {
    this.held = false;
    this.stopOscillator?.();
    this.stopOscillator = undefined;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    if (this.element) {
      this.element.pause();
      this.element.srcObject = null;
      this.element.remove();
      this.element = undefined;
    }
    this.context = undefined;
    this.releaseContext?.();
    this.releaseContext = undefined;
  };

  private create = (): HTMLAudioElement | undefined => {
    let release: (() => void) | undefined;
    try {
      const shared = sharedAudioContext.acquire();
      if (!shared) return undefined;
      const { context } = shared;
      release = shared.release;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      gain.gain.value = 0;
      const destination = context.createMediaStreamDestination();
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      const stream = destination.stream;
      const element = document.createElement('audio');
      element.hidden = true;
      element.controls = false;
      element.disableRemotePlayback = true;
      element.setAttribute('x-webkit-airplay', 'deny');
      element.setAttribute('playsinline', '');
      element.setAttribute('data-stream-silent-audio', '');
      document.body.append(element);

      this.stopOscillator = () => {
        oscillator.stop();
        oscillator.disconnect();
        gain.disconnect();
      };
      this.context = context;
      this.releaseContext = release;
      this.stream = stream;
      return element;
    } catch (err) {
      this.logger.warn('Failed to create the silent audio element', err);
      release?.();
      return undefined;
    }
  };
}
