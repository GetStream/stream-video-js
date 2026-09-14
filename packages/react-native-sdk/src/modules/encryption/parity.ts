/**
 * Compile-time proof that the React Native {@link EncryptionManager} exposes the
 * same public surface as the web one in `@stream-io/video-client`.
 *
 * This file has no runtime output and is imported by nothing. It exists because
 * the SDK's entry point deliberately *shadows* the client's `EncryptionManager`
 * export with this platform's implementation: a host writing against the
 * documented API gets whichever class its platform ships, so the two surfaces
 * diverging would be a silent break for that host rather than a build error.
 * Both directions are asserted, so adding a method to either manager fails the
 * build until the other one follows. Keep it that way, or delete both managers'
 * claim to a shared API.
 *
 * `test:types` and the `tsc` pass in `bob build` both cover `src`, so CI runs
 * this whether or not anything imports it.
 */
import type { EncryptionManager as WebEncryptionManager } from '@stream-io/video-client';
import type { EncryptionManager } from './EncryptionManager';

/** Fails to compile unless `T` is exactly `true`. */
type AssertTrue<T extends true> = T;

/**
 * Public members only.
 *
 * A class type carrying `private` members is nominal, so the two managers can
 * never be compared as classes however identical their APIs. `keyof` yields
 * public keys alone, which is also precisely the surface a host can touch.
 */
type PublicSurface<T> = { [K in keyof T]: T[K] };

/**
 * `emit` is public on the web manager only because it extends the shared
 * `TypedEventEmitter`. Dispatching a forged E2EE event is not part of the
 * documented API — `SPEC.md` §2 lists `on`/`off` and nothing else — so it is
 * excluded here rather than mirrored on this side.
 */
type WebSurface = Omit<PublicSurface<WebEncryptionManager>, 'emit'>;
type NativeSurface = PublicSurface<EncryptionManager>;

/** Every documented web member exists here, with a compatible signature. */
export type NativeCoversWeb = AssertTrue<
  NativeSurface extends WebSurface ? true : false
>;

/**
 * ...and nothing extra. A React Native-only method would compile fine but make
 * host code silently unportable, which is the failure this file exists to catch.
 */
export type WebCoversNative = AssertTrue<
  WebSurface extends NativeSurface ? true : false
>;

/**
 * The statics are checked by signature rather than by assignability: both
 * `create`s return their own class, so comparing them whole would only ever
 * restate that the two classes are nominally distinct.
 */
export type CreateAcceptsSameArguments = AssertTrue<
  Parameters<typeof EncryptionManager.create> extends Parameters<
    typeof WebEncryptionManager.create
  >
    ? Parameters<typeof WebEncryptionManager.create> extends Parameters<
        typeof EncryptionManager.create
      >
      ? true
      : false
    : false
>;

export type CreateResolvesAManager = AssertTrue<
  Awaited<ReturnType<typeof EncryptionManager.create>> extends NativeSurface
    ? true
    : false
>;

export type IsSupportedMatches = AssertTrue<
  typeof EncryptionManager.isSupported extends typeof WebEncryptionManager.isSupported
    ? typeof WebEncryptionManager.isSupported extends typeof EncryptionManager.isSupported
      ? true
      : false
    : false
>;
