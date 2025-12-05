import android.content.Context
import android.media.RingtoneManager
import android.net.Uri
import android.util.Log
import androidx.core.net.toUri


object ResourceUtils {
  private const val TAG = "[Callingx] ResourceUtils"

  private val resourceIdCache = mutableMapOf<String, Int>()

  private fun getResourceIdByName(context: Context, name: String?, type: String): Int {
    if (name.isNullOrEmpty()) {
      return 0
    }

    val normalizedName = name.lowercase().replace("-", "_")
    val key = "${normalizedName}_$type"

    synchronized(resourceIdCache) {
      resourceIdCache[key]?.let {
        return it
      }

      val packageName = context.packageName

      val id = context.resources.getIdentifier(normalizedName, type, packageName)
      resourceIdCache[key] = id
      return id
    }
  }

  fun getSoundUri(context: Context, sound: String?): Uri? {
    Log.d(TAG, "getSoundUri: Getting sound URI for: $sound")
    return when {
      sound == null -> null
      sound.contains("://") -> sound.toUri()
      sound.equals("default", ignoreCase = true) -> {
        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
      }

      else -> {
        // The API user is attempting to set a sound by file name, verify it exists
        var soundResourceId = getResourceIdByName(context, sound, "raw")
        if (soundResourceId == 0 && sound.contains(".")) {
          soundResourceId = getResourceIdByName(context, sound.substringBeforeLast('.'), "raw")
        }
        if (soundResourceId == 0) {
          null
        } else {
          // Use the actual sound name vs the resource ID, to obtain a stable URI, Issue #341
          "android.resource://${context.packageName}/raw/$sound".toUri()
        }
      }
    }
  }
}
