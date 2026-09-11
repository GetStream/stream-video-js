import { useI18n } from '@stream-io/video-react-sdk';
import type {
  LooseTranslateFunction,
  TDateTimeParser,
} from '@stream-io/video-react-sdk';

/**
 * `useI18n().t` is typed to the SDK's catalog, so an app-owned key is a compile error there.
 * Widening it here is the deliberate, greppable place where that check is given up; the app's
 * own copy still resolves, because its dictionary is registered on the same instance.
 *
 * Both types come from the SDK rather than `@stream-io/i18n` directly. That package is an
 * implementation detail of the SDK, and a second copy resolved from this app's `node_modules`
 * would register dayjs plugins on the wrong module.
 *
 * `LooseTranslateFunction`'s parameters are deliberately loose. Under `strictFunctionTypes` a
 * function parameter is checked contravariantly, so the SDK's four-overload `t` — whose key
 * parameter is a union of *its* catalog keys — is not assignable to one declared as taking
 * `string`.
 */
export const useAppI18n = () =>
  useI18n() as { t: LooseTranslateFunction; tDateTimeParser: TDateTimeParser };
