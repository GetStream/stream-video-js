package io.getstream.rn.callingx

import android.content.Context
import android.net.Uri
import androidx.core.net.toUri

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
 */
internal fun toTelecomAddress(context: Context, handle: String): Uri {
  val trimmed = handle.trim()
  if (trimmed.isEmpty()) {
    return Uri.fromParts(context.packageName, "unknown", null)
  }
  val parsed = trimmed.toUri()
  if (!parsed.scheme.isNullOrBlank()) {
    return parsed
  }
  return Uri.fromParts(context.packageName, trimmed, null)
}
