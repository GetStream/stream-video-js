import { describe, expect, it } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { getCallExtraOpts } from '../extraOpts';
import type { CallSettingsResponse } from '../../gen/coordinator';

const withExtraOpts = (extraOpts: unknown) =>
  fromPartial<CallSettingsResponse>({
    extra_opts: extraOpts as Record<string, any>,
  });

describe('getCallExtraOpts', () => {
  it('returns nothing when extra_opts is missing', () => {
    expect(getCallExtraOpts(undefined)).toEqual({});
    expect(getCallExtraOpts(withExtraOpts(undefined))).toEqual({});
    expect(getCallExtraOpts(withExtraOpts([]))).toEqual({});
  });

  it('reads every known option', () => {
    const extraOpts = getCallExtraOpts(
      withExtraOpts({
        screenshare_content_hint: 'detail',
        audio: {
          media_constraints: {
            auto_gain_control: false,
            noise_suppression: true,
            echo_cancellation: true,
          },
          use_web_audio: true,
          play_silence: false,
        },
        noise_cancellation: {
          enabled_in_safari: true,
          engine: 'krisp',
          model_path: 'https://cdn.example.com/model.kef',
        },
      }),
    );
    expect(extraOpts).toEqual({
      screenshare_content_hint: 'detail',
      audio: {
        media_constraints: {
          auto_gain_control: false,
          noise_suppression: true,
          echo_cancellation: true,
        },
        use_web_audio: true,
        play_silence: false,
      },
      noise_cancellation: {
        enabled_in_safari: true,
        engine: 'krisp',
        model_path: 'https://cdn.example.com/model.kef',
      },
    });
  });

  it('drops values of an unexpected type', () => {
    const extraOpts = getCallExtraOpts(
      withExtraOpts({
        screenshare_content_hint: 'cinematic',
        audio: {
          media_constraints: { auto_gain_control: 'false' },
          use_web_audio: 1,
          play_silence: null,
        },
        noise_cancellation: 'krisp',
      }),
    );
    expect(extraOpts.screenshare_content_hint).toBeUndefined();
    expect(
      extraOpts.audio?.media_constraints?.auto_gain_control,
    ).toBeUndefined();
    expect(extraOpts.audio?.use_web_audio).toBeUndefined();
    expect(extraOpts.audio?.play_silence).toBeUndefined();
    expect(extraOpts.noise_cancellation).toBeUndefined();
  });

  it('normalizes the noise cancellation engine', () => {
    const engineOf = (engine: unknown) =>
      getCallExtraOpts(withExtraOpts({ noise_cancellation: { engine } }))
        .noise_cancellation?.engine;
    expect(engineOf('krisp')).toBe('krisp');
    expect(engineOf(' Stream ')).toBe('stream');
    expect(engineOf('KRISP')).toBe('krisp');
    expect(engineOf('stream-v2')).toBeUndefined();
    expect(engineOf(42)).toBeUndefined();
  });
});
