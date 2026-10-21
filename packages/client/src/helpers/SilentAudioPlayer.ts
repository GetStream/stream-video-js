import { isIOS } from './browsers';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';

/**
 * Keeps a silent, MediaStream-backed `<audio>` element playing on iOS.
 *
 * iOS WebKit lets a MediaStream-backed media element start playing without a
 * user gesture only while the page captures the mic or camera, or already
 * plays audio. Muting stops the mic track, so once the short user-activation
 * window lapses, a remote participant who joins later stays silent until
 * the user taps the page. A playing silent element keeps the page in the
 * "already playing audio" state, so remote audio keeps autoplaying.
 *
 * Limited to iOS: desktop Safari would show the tab as playing audio for
 * the whole call.
 */
export class SilentAudioPlayer {
  private logger = videoLoggerSystem.getLogger('SilentAudioPlayer');
  private tracer: Tracer;
  private element: HTMLAudioElement | undefined;
  private context: AudioContext | undefined;
  private stream: MediaStream | undefined;
  private abortController: AbortController | undefined;

  constructor(tracer: Tracer) {
    this.tracer = tracer;
  }

  /**
   * Starts the silent element, or resumes it if it was paused.
   * Succeeds only while iOS permits playback: within a user gesture,
   * while capturing, or while other audio is playing. Otherwise it is a
   * no-op until the next call. Does nothing outside iOS.
   */
  play = () => {
    if (!isIOS() || typeof AudioContext === 'undefined') return;
    this.element ??= this.create();
    this.resume();
  };

  /**
   * Resumes the silent element if {@link play} created it and it is paused.
   * Does nothing before {@link play} or after {@link dispose}.
   */
  resume = () => {
    const element = this.element;
    if (!element || !element.paused || document.hidden) return;
    // never resume an "interrupted" context: on iOS that can leave its
    // output stuck; WebKit resumes it once the interruption ends
    if (this.context?.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
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
   * Stops playback and releases the element and its audio context.
   */
  dispose = async () => {
    this.abortController?.abort();
    this.abortController = undefined;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    if (this.element) {
      this.element.pause();
      this.element.srcObject = null;
      this.element.remove();
      this.element = undefined;
    }
    const context = this.context;
    this.context = undefined;
    if (context && context.state !== 'closed') {
      await context.close().catch(() => {});
    }
  };

  private create = (): HTMLAudioElement | undefined => {
    let context: AudioContext | undefined;
    try {
      context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      gain.gain.value = 0;
      const destination = context.createMediaStreamDestination();
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      const stream = destination.stream;
      const element = document.createElement('audio');
      element.hidden = true;
      element.setAttribute('playsinline', '');
      element.setAttribute('data-stream-silent-audio', '');
      document.body.append(element);

      const controller = new AbortController();
      document.addEventListener(
        'visibilitychange',
        () => {
          if (!document.hidden) return this.resume();
          element.pause();
          element.srcObject = null;
        },
        { signal: controller.signal },
      );

      this.context = context;
      this.stream = stream;
      this.abortController = controller;
      return element;
    } catch (err) {
      this.logger.warn('Failed to create the silent audio element', err);
      context?.close().catch(console.error);
      return undefined;
    }
  };
}
