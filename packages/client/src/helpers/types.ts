export type AudioSessionState = 'inactive' | 'active' | 'interrupted';

export type AudioSessionType =
  | 'auto'
  | 'playback'
  | 'transient'
  | 'transient-solo'
  | 'ambient'
  | 'play-and-record';

export interface AudioSession extends EventTarget {
  type: AudioSessionType;
  state: AudioSessionState;

  onstatechange: EventListenerOrEventListenerObject;
}

declare global {
  interface Navigator {
    /**
     * `audioSession` is available in Safari only. See:
     * https://github.com/w3c/audio-session/blob/main/explainer.md
     */
    audioSession?: AudioSession;
  }
}
