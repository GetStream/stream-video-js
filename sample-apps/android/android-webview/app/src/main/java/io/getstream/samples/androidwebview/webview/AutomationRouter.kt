package io.getstream.samples.androidwebview.webview

import android.net.Uri
import io.getstream.samples.androidwebview.AppState
import io.getstream.samples.androidwebview.LogTab
import io.getstream.samples.androidwebview.scenarios.AudioScenarios
import io.getstream.samples.androidwebview.scenarios.NetworkScenarios
import java.net.URL

/**
 * Debug-only `androidwebview://` commands so a test run can drive the app
 * from the shell, with the same grammar as the iOS sample's `iowebview://`:
 *
 * ```
 * adb shell am start -n io.getstream.samples.androidwebview/.MainActivity -d '<command>'
 * ```
 *
 * - `androidwebview://load?url=<percent-encoded URL>` loads a page.
 * - `androidwebview://scenario?name=<id>` runs a scenario from [scenarios].
 * - `androidwebview://eval?js=<percent-encoded function body>` runs JS in the
 *   page as an async function (`await` works; `return` a value to log it to
 *   the Console tab). `eval?src=<percent-encoded http URL>` fetches the
 *   script natively first.
 */
class AutomationRouter(
    private val web: WebController,
    private val audio: AudioScenarios,
    private val network: NetworkScenarios,
    private val onLoad: (String) -> Unit,
) {
    fun handle(uri: Uri) {
        when (uri.host) {
            "load" -> {
                val url = uri.getQueryParameter("url")
                if (url.isNullOrBlank()) {
                    AppState.log(LogTab.ERRORS, "automation", "load: missing url")
                    return
                }
                onLoad(url)
            }
            "scenario" -> {
                val name = uri.getQueryParameter("name").orEmpty()
                val run = scenarios[name]
                if (run == null) {
                    AppState.log(
                        LogTab.ERRORS,
                        "automation",
                        "unknown scenario '$name'; known: ${scenarios.keys.sorted().joinToString(",")}",
                    )
                    return
                }
                AppState.log(LogTab.SCENARIOS, "automation", "scenario $name")
                run()
            }
            "eval" -> {
                val src = uri.getQueryParameter("src")
                if (src != null) {
                    val url = runCatching { URL(src) }.getOrNull()
                    if (url == null) {
                        AppState.log(LogTab.ERRORS, "automation", "eval: invalid src $src")
                        return
                    }
                    web.evaluate(url)
                } else {
                    web.evaluate(uri.getQueryParameter("js").orEmpty())
                }
            }
            else -> AppState.log(LogTab.ERRORS, "automation", "unknown command $uri")
        }
    }

    private val scenarios: Map<String, () -> Unit> by lazy {
        buildMap {
            put("restore") { audio.restoreForWebRTC() }
            put("ding-mix") { audio.playDingMix() }
            put("ding-exclusive") { audio.playDingExclusive() }
            put("ding-auto-restore") { audio.playDingWithAutoRestore() }
            put("ding-no-restore") { audio.playDingExclusiveNoRestore() }
            put("ringtone-start") { audio.startRingtone() }
            put("ringtone-stop") { audio.stopRingtone() }
            put("notification") { audio.scheduleNotification() }
            put("dump") { audio.dumpState() }
            put("stale-offline") { network.dispatchStaleOfflineEvent() }
            AudioScenarios.allModes.forEach { mode ->
                put("mode-${StreamVideoHostBridge.modeName(mode)}") { audio.setMode(mode) }
            }
            AudioScenarios.sampleRates.forEach { rate ->
                put("tone-$rate") { audio.playTone(rate) }
                put("mic-capture-$rate") { audio.startMicCapture(rate) }
            }
            put("mic-capture-stop") { audio.stopMicCapture() }
            put("toggle-route") { audio.toggleRoute() }
            put("fgs-start") { audio.startForegroundService() }
            put("fgs-stop") { audio.stopForegroundService() }
            put("crash-renderer") { web.crashRenderer() }
        }
    }

    companion object {
        const val SCHEME = "androidwebview"
    }
}
