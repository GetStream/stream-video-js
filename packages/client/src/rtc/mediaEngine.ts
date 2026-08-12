/**
 * A per-call media engine. On React Native it owns the call's native
 * `PeerConnectionFactory` (built with the call's audio configuration); on web it
 * is a no-op. Capture (`getUserMedia`/`getDisplayMedia`) and peer-connection creation
 * always go through the WebRTC globals, which resolve to this factory while it
 * is the live call factory — so the engine only needs to manage its lifecycle.
 *
 * @internal
 */
export interface CallMediaEngine {
  dispose(): Promise<boolean>;
}

/**
 * Creates a per-call {@link CallMediaEngine}. Registered once at SDK startup
 * via {@link setCallMediaEngineProvider}. May return the engine synchronously
 * (the default globals engine) or asynchronously (React Native, where allocating
 * the native per-call factory is an async bridge call).
 *
 * @internal
 */
export type CallMediaEngineProvider = () =>
  CallMediaEngine | Promise<CallMediaEngine>;

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
