package io.getstream.samples.androidwebview

import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.compose.runtime.mutableStateListOf

enum class LogTab(val label: String) {
    CONSOLE("Console"),
    ERRORS("Errors"),
    LIFECYCLE("Lifecycle"),
    SCENARIOS("Scenarios"),
}

data class LogEntry(
    val id: Long,
    val timestamp: Long,
    val tab: LogTab,
    val level: String,
    val message: String,
)

/**
 * Observable log shared between the Compose UI and headless helpers such as
 * `AudioScenarios`. Mutations are bounced to the main thread so off-thread
 * callers can safely call [log]. Every entry is mirrored to logcat under the
 * `AndroidWebView` tag.
 */
object AppState {
    private const val TAG = "AndroidWebView"
    private const val MAX_ENTRIES = 1000

    private val mainHandler = Handler(Looper.getMainLooper())
    private var nextId = 0L

    val entries = mutableStateListOf<LogEntry>()

    fun log(tab: LogTab, level: String = "info", message: String) {
        val timestamp = System.currentTimeMillis()
        Log.d(TAG, "[${tab.label}] $level: $message")
        runOnMain {
            entries.add(LogEntry(nextId++, timestamp, tab, level, message))
            if (entries.size > MAX_ENTRIES) {
                entries.removeRange(0, entries.size - MAX_ENTRIES)
            }
        }
    }

    fun clear(tab: LogTab) {
        runOnMain { entries.removeAll { it.tab == tab } }
    }

    private fun runOnMain(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) block() else mainHandler.post(block)
    }
}
