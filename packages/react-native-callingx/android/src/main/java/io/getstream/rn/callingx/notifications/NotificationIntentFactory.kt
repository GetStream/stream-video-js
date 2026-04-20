package io.getstream.rn.callingx.notifications

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import io.getstream.rn.callingx.CallingxModuleImpl
import kotlin.math.absoluteValue

object NotificationIntentFactory {
  // Base request codes for PendingIntents — combined with callId hash for uniqueness
  private const val REQUEST_CODE_LAUNCH_ACTIVITY = 1001
  private const val REQUEST_CODE_RECEIVER_ACTIVITY = 2001
  private const val REQUEST_CODE_SERVICE = 3001

  /** Generates a unique request code per callId + base offset to avoid PendingIntent collisions. */
  private fun requestCodeFor(callId: String, base: Int): Int {
    return (base + callId.hashCode()).absoluteValue
  }

  fun getPendingNotificationIntent(
    context: Context,
    action: String,
    callId: String,
    source: String,
    includeLaunchActivity: Boolean
  ): PendingIntent {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      getReceiverActivityIntent(context, action, callId, source, includeLaunchActivity)
    } else {
      getPendingServiceIntent(context, action, callId, source)
    }
  }

  fun getPendingServiceIntent(context: Context, action: String, callId: String, source: String): PendingIntent {
    val intent =
      Intent(context, NotificationReceiverService::class.java).apply {
        this.action = action
        putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        putExtra(CallingxModuleImpl.EXTRA_SOURCE, source)
      }

    return PendingIntent.getService(
      context,
      requestCodeFor(callId, REQUEST_CODE_SERVICE),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    )
  }

  fun getReceiverActivityIntent(context: Context, action: String, callId: String, source: String, includeLaunchActivity: Boolean): PendingIntent {
    val receiverIntent =
      Intent(context, NotificationReceiverActivity::class.java).apply {
        this.action = action
        putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        putExtra(CallingxModuleImpl.EXTRA_SOURCE, source)
      }

    val launchActivity = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val launchActivityIntent =
      launchActivity?.let { base ->
        Intent(base).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
      }

    // intents are started in order and build a synthetic back stack
    // the last intent is the one on top, so the launch activity should come first
    val intents =
      if (includeLaunchActivity && launchActivityIntent != null) {
        arrayOf(launchActivityIntent, receiverIntent)
      } else {
        arrayOf(receiverIntent)
      }

    return PendingIntent.getActivities(
      context,
      requestCodeFor(callId, REQUEST_CODE_RECEIVER_ACTIVITY),
      intents,
      PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
  }

  fun getLaunchActivityIntent(context: Context, action: String, callId: String, source: String? = null): PendingIntent {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val callIntent =
      Intent(launchIntent).apply {
        this.action = action
        putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        source?.let { putExtra(CallingxModuleImpl.EXTRA_SOURCE, it) }
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }

    return PendingIntent.getActivity(
      context,
      requestCodeFor(callId, REQUEST_CODE_LAUNCH_ACTIVITY),
      callIntent,
      PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
  }

  fun getPendingBroadcastIntent(
    context: Context,
    action: String,
    callId: String,
    addExtras: Intent.() -> Unit = {}
  ): PendingIntent {
    val intent =
      Intent(action).apply {
        setPackage(context.packageName)
        putExtra(CallingxModuleImpl.EXTRA_CALL_ID, callId)
        addExtras(this)
      }

    // Use action + callId hash for unique request code per action per call
    return PendingIntent.getBroadcast(
      context,
      (action.hashCode() + callId.hashCode()).absoluteValue,
      intent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
  }
}
