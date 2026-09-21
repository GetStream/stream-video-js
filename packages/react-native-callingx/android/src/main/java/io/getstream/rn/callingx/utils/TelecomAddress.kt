package io.getstream.rn.callingx

import android.net.Uri
import androidx.core.net.toUri

/**
 * ColorOS Telecom NPEs in PhoneNumberUtilsExtImpl.getNumberFromIntent when the
 * call address has a null scheme, then UserCallIntentProcessor.blockAndLaunchSystemDialer
 * crashes system_server (full device reboot). Stream passes opaque user ids
 * which `String.toUri()` parses with scheme=null.
 *
 * Core-Telecom documents sip: for VoIP handles that are not PSTN numbers.
 * Do not use tel: — ColorOS may try to place a real dialer call.
 */
internal fun toTelecomAddress(handle: String): Uri {
  val trimmed = handle.trim()
  if (trimmed.isEmpty()) {
    return Uri.fromParts("sip", "unknown", null)
  }
  val parsed = trimmed.toUri()
  if (!parsed.scheme.isNullOrBlank()) {
    return parsed
  }
  return Uri.fromParts("sip", trimmed, null)
}
