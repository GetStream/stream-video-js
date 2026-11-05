import type { CallSettingsResponse } from '../gen/coordinator';

/**
 * A content hint for the screen share track.
 */
export type ScreenShareContentHint = '' | 'motion' | 'detail' | 'text';

/**
 * The typed view of `call.settings.extra_opts`: client tuning that Stream
 * manages per call type. Every field is optional: unset means the SDK keeps
 * its default.
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
    engine?: string;
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
    screenshare_content_hint: asContentHint(extraOpts.screenshare_content_hint),
    audio: audio && {
      media_constraints: mediaConstraints && {
        auto_gain_control: asBoolean(mediaConstraints.auto_gain_control),
        noise_suppression: asBoolean(mediaConstraints.noise_suppression),
        echo_cancellation: asBoolean(mediaConstraints.echo_cancellation),
      },
      use_web_audio: asBoolean(audio.use_web_audio),
      play_silence: asBoolean(audio.play_silence),
    },
    noise_cancellation: noiseCancellation && {
      enabled_in_safari: asBoolean(noiseCancellation.enabled_in_safari),
      engine: asString(noiseCancellation.engine),
      model_path: asString(noiseCancellation.model_path),
    },
  };
};
