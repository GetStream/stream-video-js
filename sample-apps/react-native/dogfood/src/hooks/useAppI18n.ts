import { useI18n } from '@stream-io/video-react-native-sdk';
import type {
  LooseTranslateFunction,
  TDateTimeParser,
} from '@stream-io/video-react-native-sdk';

/**
 * `useI18n().t` is typed to the SDK's catalog, so an app-owned key is a compile error there.
 * Widening it here is the deliberate, greppable place where that check is given up; the app's
 * own copy still resolves, because it is registered on the same instance.
 *
 * Both types come from the SDK rather than `@stream-io/i18n` directly: that package is an
 * implementation detail of the SDK, and a second copy resolved from this app's `node_modules`
 * would register dayjs plugins on the wrong module.
 */
export const useAppI18n = () =>
  useI18n() as { t: LooseTranslateFunction; tDateTimeParser: TDateTimeParser };
