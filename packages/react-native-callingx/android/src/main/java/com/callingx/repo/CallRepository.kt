import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.DisconnectCause
import com.callingx.model.Call
import com.callingx.repo.TelecomCallRepository
import kotlinx.coroutines.flow.StateFlow

interface CallRepository {

  enum class EventSource {
    APP, SYS
  }

  interface Listener {
    fun onCallStateChanged(call: Call)
    fun onIsCallAnswered(callId: String, source: EventSource)
    fun onIsCallDisconnected(callId: String?, cause: DisconnectCause, source: EventSource)
    fun onIsCallInactive(callId: String)
    fun onIsCallActive(callId: String)
    fun onCallRegistered(callId: String)
    fun onMuteCallChanged(callId: String, isMuted: Boolean)
    fun onCallEndpointChanged(callId: String, endpoint: String)
  }

  val currentCall: StateFlow<Call>

  fun setListener(listener: Listener)
  fun release()

  suspend fun registerCall(
    callId: String,
    displayName: String,
    address: Uri,
    isIncoming: Boolean,
    isVideo: Boolean,
    displayOptions: Bundle?,
  )
}

object CallRepositoryFactory {

  fun create(context: Context): CallRepository {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      TelecomCallRepository(context) // Your current CallRepository renamed
    } else {
      LegacyCallRepository(context) // Fallback implementation
    }
  }
}
