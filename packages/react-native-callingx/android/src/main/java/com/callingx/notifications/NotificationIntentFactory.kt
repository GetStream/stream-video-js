package com.callingx.notifications

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.callingx.CallingxModule

object NotificationIntentFactory {
  // Stable request codes for PendingIntents
  private const val REQUEST_CODE_LAUNCH_ACTIVITY = 1001
  private const val REQUEST_CODE_RECEIVER_ACTIVITY = 1002
  private const val REQUEST_CODE_SERVICE = 1003

  fun getPendingNotificationIntent(
    context: Context,
    action: String,
    callId: String,
    source: String
  ): PendingIntent {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      getReceiverActivityIntent(context, action, callId, source)
    } else {
      getPendingServiceIntent(context, action, callId, source)
    }
  }

  fun getPendingServiceIntent(context: Context, action: String, callId: String, source: String): PendingIntent {
    val intent =
      Intent(context, NotificationReceiverService::class.java).apply {
        this.action = action
        putExtra(CallingxModule.EXTRA_CALL_ID, callId)
        putExtra(CallingxModule.EXTRA_SOURCE, source)
      }

    return PendingIntent.getService(
      context,
      REQUEST_CODE_SERVICE,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    )
  }

  fun getReceiverActivityIntent(context: Context, action: String, callId: String, source: String): PendingIntent {
    val receiverIntent =
      Intent(context, NotificationReceiverActivity::class.java).apply {
        this.action = action
        putExtra(CallingxModule.EXTRA_CALL_ID, callId)
        putExtra(CallingxModule.EXTRA_SOURCE, source)
      }

    val launchActivity = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val launchActivityIntent =
      Intent(launchActivity).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }

    return PendingIntent.getActivities(
      context,
      REQUEST_CODE_RECEIVER_ACTIVITY,
      arrayOf(launchActivityIntent, receiverIntent),
      PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
  }

  fun getLaunchActivityIntent(context: Context, action: String, callId: String, source: String? = null): PendingIntent {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val callIntent =
      Intent(launchIntent).apply {
        this.action = action
        putExtra(CallingxModule.EXTRA_CALL_ID, callId)
        source?.let { putExtra(CallingxModule.EXTRA_SOURCE, it) }
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }

    return PendingIntent.getActivity(
      context,
      REQUEST_CODE_LAUNCH_ACTIVITY,
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
        putExtra(CallingxModule.EXTRA_CALL_ID, callId)
        addExtras(this)
      }

    // Use action hashCode for unique request code per action type
    return PendingIntent.getBroadcast(
      context,
      action.hashCode(),
      intent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
  }
}
