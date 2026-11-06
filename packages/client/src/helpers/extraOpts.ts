import type { CallSettingsResponse } from '../gen/coordinator';
import { isChrome, isFirefox, isSafari, isWebKit } from './browsers';

/**
 * A content hint for the screen share track.
 */
export type ScreenShareContentHint = '' | 'motion' | 'detail' | 'text';

const noiseCancellationEngines = ['krisp', 'stream'] as const;

/**
 * A noise cancellation engine the call settings can select.
 */
export type NoiseCancellationEngineName =
  (typeof noiseCancellationEngines)[number];

/**
 * The typed view of `call.settings.extra_opts`: client tuning that Stream
 * manages per call type. Every field is optional: unset means the SDK keeps
 * its default.
 *
 * Every option can be overridden per browser with a suffixed key next to it,
 * e.g. `use_web_audio_safari` next to `use_web_audio`. Each browser matches
 * exactly one suffix, which wins over the plain key: `_safari` (Safari,
 * including the other iOS browsers, which report as Safari), `_webkit` (the
 * other WebKit runtimes, e.g. WebViews), `_chrome` (Chromium browsers) and
 * `_firefox`. Groups (`audio`, `media_constraints`, `noise_cancellation`)
 * take no suffix: their options do.
 *
 * @internal
 */
export type CallExtraOpts = {
  screenshare_content_hint?: ScreenShareContentHint;
  audio?: {
    media_constraints?: {
      auto_gain_control?: boolean;
      noise_suppression?: boolean;
      echo_cancellation?: boolean;
    };
    use_web_audio?: boolean;
    play_silence?: boolean;
  };
  noise_cancellation?: {
    enabled_in_safari?: boolean;
    engine?: NoiseCancellationEngineName;
    model_path?: string;
  };
};

const contentHints: ReadonlyArray<unknown> = ['', 'motion', 'detail', 'text'];

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const asContentHint = (value: unknown): ScreenShareContentHint | undefined =>
  contentHints.includes(value) ? (value as ScreenShareContentHint) : undefined;

/**
 * Engine names are matched case-insensitively. An unknown engine reads as
 * unset, so the default engine runs instead of noise cancellation being
 * turned off for a typo.
 */
const asEngine = (value: unknown): NoiseCancellationEngineName | undefined => {
  if (typeof value !== 'string') return undefined;
  const engine = value.trim().toLowerCase();
  return noiseCancellationEngines.find((name) => name === engine);
};

/**
 * The key suffix of this browser, `null` when none applies (e.g. outside a
 * browser). The browser can't change at runtime, so it is detected once.
 */
let browserSuffix: string | null | undefined;
const getBrowserSuffix = (): string | null => {
  if (browserSuffix !== undefined) return browserSuffix;
  if (isSafari()) browserSuffix = 'safari';
  else if (isWebKit()) browserSuffix = 'webkit';
  else if (isFirefox()) browserSuffix = 'firefox';
  else if (isChrome()) browserSuffix = 'chrome';
  else browserSuffix = null;
  return browserSuffix;
};

/**
 * Reads an option's raw value: the browser-suffixed key when it is set,
 * the plain key otherwise.
 */
const read = (record: Record<string, unknown>, key: string): unknown => {
  const suffix = getBrowserSuffix();
  const value = suffix ? record[`${key}_${suffix}`] : undefined;
  return value !== undefined ? value : record[key];
};

/**
 * Reads `extra_opts` from the call settings. `extra_opts` is untyped on the
 * wire, so values of an unexpected type are dropped and the SDK default
 * applies for them.
 *
 * @internal
 */
export const getCallExtraOpts = (
  settings: CallSettingsResponse | undefined,
): CallExtraOpts => {
  const extraOpts = asRecord(settings?.extra_opts);
  if (!extraOpts) return {};

  const audio = asRecord(extraOpts.audio);
  const mediaConstraints = asRecord(audio?.media_constraints);
  const noiseCancellation = asRecord(extraOpts.noise_cancellation);
  return {
    screenshare_content_hint: asContentHint(
      read(extraOpts, 'screenshare_content_hint'),
    ),
    audio: audio && {
      media_constraints: mediaConstraints && {
        auto_gain_control: asBoolean(
          read(mediaConstraints, 'auto_gain_control'),
        ),
        noise_suppression: asBoolean(
          read(mediaConstraints, 'noise_suppression'),
        ),
        echo_cancellation: asBoolean(
          read(mediaConstraints, 'echo_cancellation'),
        ),
      },
      use_web_audio: asBoolean(read(audio, 'use_web_audio')),
      play_silence: asBoolean(read(audio, 'play_silence')),
    },
    noise_cancellation: noiseCancellation && {
      enabled_in_safari: asBoolean(
        read(noiseCancellation, 'enabled_in_safari'),
      ),
      engine: asEngine(read(noiseCancellation, 'engine')),
      model_path: asString(read(noiseCancellation, 'model_path')),
    },
  };
};
