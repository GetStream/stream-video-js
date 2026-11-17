package io.getstream.samples.androidwebview.scenarios

import android.os.Handler
import android.os.Looper
import io.getstream.samples.androidwebview.AppState
import io.getstream.samples.androidwebview.LogTab
import io.getstream.samples.androidwebview.webview.WebController

/**
 * Network scenarios: dispatch browser network events into the page while the
 * real network keeps working, to exercise how the SDK reacts to them.
 * Android counterpart of the iOS sample's `NetworkScenarios`.
 */
class NetworkScenarios(private val web: WebController) {
    private val handler = Handler(Looper.getMainLooper())

    /**
     * Dispatches `online`, then `offline` 0.5 s later, on a working network:
     * the order a page can receive when it resumes from a frozen state. The
     * call should stay joined, or be back within about 2 s, without a
     * reconnect storm.
     */
    fun dispatchStaleOfflineEvent() {
        AppState.log(LogTab.SCENARIOS, "network", "stale offline event: online, then offline 0.5s later")
        dispatch("online")
        handler.postDelayed({ dispatch("offline") }, 500)
    }

    private fun dispatch(type: String) {
        AppState.log(LogTab.SCENARIOS, "network", "dispatch window '$type'")
        web.dispatchWindowEvent(type)
    }
}
