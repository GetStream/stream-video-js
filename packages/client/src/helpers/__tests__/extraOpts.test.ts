import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('reads resume_after_interruption for audio and video', () => {
    const extraOpts = getCallExtraOpts(
      withExtraOpts({
        audio: { resume_after_interruption: true },
        video: { resume_after_interruption: false },
      }),
    );
    expect(extraOpts.audio?.resume_after_interruption).toBe(true);
    expect(extraOpts.video?.resume_after_interruption).toBe(false);
  });

  it('drops a resume_after_interruption of an unexpected type', () => {
    const extraOpts = getCallExtraOpts(
      withExtraOpts({
        audio: { resume_after_interruption: 'true' },
        video: 'yes',
      }),
    );
    expect(extraOpts.audio?.resume_after_interruption).toBeUndefined();
    expect(extraOpts.video).toBeUndefined();
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

  describe('browser overrides', () => {
    const userAgents = {
      safari:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
      iosChrome:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
      webView:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      chrome:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
      firefox:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
      androidWebView:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36',
      googleAppWebView:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/340.0.0 Mobile/15E148 Safari/604.1',
    };

    const settings = withExtraOpts({
      screenshare_content_hint: 'detail',
      screenshare_content_hint_chrome: 'motion',
      audio: {
        use_web_audio: false,
        use_web_audio_safari: true,
        use_web_audio_webkit: 'yes',
        play_silence: true,
        play_silence_webkit: false,
        media_constraints: {
          echo_cancellation: true,
          echo_cancellation_safari: false,
          echo_cancellation_firefox: false,
        },
      },
      noise_cancellation: { engine: 'krisp', engine_webkit: 'stream' },
    });

    const readAs = (userAgent: string | undefined, from = settings) => {
      vi.stubGlobal(
        'navigator',
        userAgent === undefined ? undefined : { userAgent },
      );
      const opts = getCallExtraOpts(from);
      return {
        contentHint: opts.screenshare_content_hint,
        useWebAudio: opts.audio?.use_web_audio,
        playSilence: opts.audio?.play_silence,
        echoCancellation: opts.audio?.media_constraints?.echo_cancellation,
        engine: opts.noise_cancellation?.engine,
      };
    };

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('applies _safari, not _webkit, in Safari', () => {
      expect(readAs(userAgents.safari)).toEqual({
        contentHint: 'detail',
        useWebAudio: true,
        playSilence: true,
        echoCancellation: false,
        engine: 'krisp',
      });
    });

    it('applies _safari to the other iOS browsers, which report as Safari', () => {
      expect(readAs(userAgents.iosChrome)).toEqual(readAs(userAgents.safari));
    });

    it('applies _webkit, not _safari, to WebViews', () => {
      expect(readAs(userAgents.webView)).toEqual({
        contentHint: 'detail',
        // use_web_audio_webkit isn't a boolean, so the SDK default applies
        useWebAudio: undefined,
        playSilence: false,
        echoCancellation: true,
        engine: 'stream',
      });
    });

    it('applies _chrome to Android WebViews', () => {
      expect(readAs(userAgents.androidWebView)).toEqual(
        readAs(userAgents.chrome),
      );
    });

    it('applies _safari to WebViews that report as Safari', () => {
      expect(readAs(userAgents.googleAppWebView)).toEqual(
        readAs(userAgents.safari),
      );
    });

    it('falls back to the plain key for a null override', () => {
      const withNull = withExtraOpts({
        audio: { use_web_audio: true, use_web_audio_safari: null },
      });
      expect(readAs(userAgents.safari, withNull).useWebAudio).toBe(true);
    });

    it('applies _chrome to Chromium browsers', () => {
      const expected = {
        contentHint: 'motion',
        useWebAudio: false,
        playSilence: true,
        echoCancellation: true,
        engine: 'krisp',
      };
      expect(readAs(userAgents.chrome)).toEqual(expected);
      expect(readAs(userAgents.edge)).toEqual(expected);
    });

    it('applies _firefox in Firefox', () => {
      expect(readAs(userAgents.firefox)).toEqual({
        contentHint: 'detail',
        useWebAudio: false,
        playSilence: true,
        echoCancellation: false,
        engine: 'krisp',
      });
    });

    it('reads the plain keys outside a browser', () => {
      expect(readAs(undefined)).toEqual({
        contentHint: 'detail',
        useWebAudio: false,
        playSilence: true,
        echoCancellation: true,
        engine: 'krisp',
      });
    });
  });
});
