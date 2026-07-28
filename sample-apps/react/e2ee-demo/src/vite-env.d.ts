/// <reference types="vite/client" />

import type { Call } from '@stream-io/video-react-sdk';

declare global {
  interface Window {
    /**
     * Live `Call` instances keyed by lowercased participant name
     * (`window.calls.alice`), published by the harness for console debugging.
     */
    calls?: Record<string, Call>;
    /** The first participant's call - a shortcut for {@link Window.calls}. */
    call?: Call;
  }
}
