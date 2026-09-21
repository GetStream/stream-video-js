package io.getstream.rn.callingx

import android.content.Context
import android.net.Uri

/**
 * ColorOS Telecom NPEs in PhoneNumberUtilsExtImpl.getNumberFromIntent when the
 * call address has a null scheme, then UserCallIntentProcessor.blockAndLaunchSystemDialer
 * crashes system_server (full device reboot). Stream passes opaque handles
 * which `String.toUri()` parses with scheme=null.
 *
 * The scheme is the app package name: AOSP `PhoneNumberUtils.getNumberFromIntent` returns
 * null for an unknown scheme, whereas a telephony scheme such as `tel:` makes Telecom
 * treat the handle as a dialable number. This matches the Stream Android SDK, which
 * registers Telecom calls with
 * `"$appSchema:${callId.id}"` (`appSchema` being the app package name).
 *
 * The handle is always wrapped, never parsed: the address is not displayed for
 * self-managed calls, and parsing would promote anything before a `:` in the handle
 * (e.g. a Stream call cid `default:abc`) to the scheme.
 */
internal fun toTelecomAddress(context: Context, handle: String): Uri =
  Uri.fromParts(context.packageName, handle, null)
