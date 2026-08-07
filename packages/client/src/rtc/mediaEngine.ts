import type { AudioBitrateProfile } from '../gen/video/sfu/models/models';

/**
 * A per-call media engine. On React Native it owns the call's native
 * `PeerConnectionFactory` (built with the call's audio profile); on web it is a
 * no-op. Capture (`getUserMedia`/`getDisplayMedia`) and peer-connection creation
 * always go through the WebRTC globals, which resolve to this factory while it
 * is the live call factory — so the engine only needs to manage its lifecycle.
 *
 * @internal
 */
export interface CallMediaEngine {
  dispose(): Promise<boolean>;
}

/**
 * The options a `Call` passes to a {@link CallMediaEngineProvider} when it
 * mints its engine.
 *
 * @internal
 */
export interface MediaEngineOptions {
  /**
   * The audio bitrate profile the call's factory should be built with.
   * Ignored by the default globals engine.
   */
  audioBitrateProfile?: AudioBitrateProfile;
}

/**
 * Creates a per-call {@link CallMediaEngine}. Registered once at SDK startup
 * via {@link setCallMediaEngineProvider} (next to `registerGlobals` on React
 * Native). May return the engine synchronously (the default globals engine) or
 * asynchronously (React Native, where allocating the native per-call factory
 * is an async bridge call).
 *
 * @internal
 */
export type CallMediaEngineProvider = (
  options: MediaEngineOptions,
) => CallMediaEngine | Promise<CallMediaEngine>;

/**
 * The default engine: a thin, stateless wrapper over the WebRTC globals.
 */
const defaultGlobalsEngine: CallMediaEngine = {
  dispose: () => Promise.resolve(true),
};

const defaultGlobalsEngineProvider: CallMediaEngineProvider = () =>
  defaultGlobalsEngine;

let provider: CallMediaEngineProvider = defaultGlobalsEngineProvider;

export const setCallMediaEngineProvider = (
  newProvider: CallMediaEngineProvider,
): void => {
  provider = newProvider;
};

export const getCallMediaEngineProvider = (): CallMediaEngineProvider =>
  provider;
