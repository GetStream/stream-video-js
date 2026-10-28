package io.getstream.samples.androidwebview.webview

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import io.getstream.samples.androidwebview.AppState
import io.getstream.samples.androidwebview.LogTab
import org.json.JSONObject

/**
 * Owns the [WebView] and the bridges that wire it into [AppState]. The
 * WebView lives inside [container], a stable host for Compose, because a
 * renderer crash forces us to replace it with a fresh instance.
 */
class WebController(
    private val context: Context,
    private val requestPermissions: PermissionRequester,
) {
    val container: FrameLayout = FrameLayout(context)

    private var webView: WebView = createWebView().also(::attach)

    private var lastUrl: String? = null

    fun load(url: String) {
        lastUrl = url
        webView.loadUrl(url)
        AppState.log(LogTab.SCENARIOS, "webview", "load $url")
    }

    fun reload() {
        val url = lastUrl
        if (webView.url == null && url != null) {
            webView.loadUrl(url)
        } else {
            webView.reload()
        }
        AppState.log(LogTab.SCENARIOS, "webview", "reload")
    }

    fun goBack(): Boolean {
        if (!webView.canGoBack()) return false
        webView.goBack()
        return true
    }

    /** Kills the renderer to exercise [NavigationClient.onRenderProcessGone]. */
    fun crashRenderer() {
        AppState.log(LogTab.SCENARIOS, "webview", "loading chrome://crash")
        webView.loadUrl("chrome://crash")
    }

    fun refreshHostBridgePermissions() {
        webView.configureStreamVideoHostBridge().refreshTelephonyObservation()
    }

    fun destroy() {
        dispose(webView)
    }

    // JavaScript is the point of this harness: it runs the React SDK.
    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView {
        val wv = WebView(context)
        wv.settings.javaScriptEnabled = true
        wv.settings.domStorageEnabled = true
        wv.settings.mediaPlaybackRequiresUserGesture = false

        val chromeClient = ChromeClient(context.applicationContext, requestPermissions)
        wv.webChromeClient = chromeClient
        wv.webViewClient = NavigationClient(::handleRenderProcessGone)
        installPageScripts(wv, chromeClient)

        wv.configureStreamVideoHostBridge(
            StreamVideoHostBridgeConfiguration(
                logsEnabled = true,
                logger = { AppState.log(LogTab.LIFECYCLE, "bridge", it) },
            ),
        )
        return wv
    }

    /**
     * Injects `console-mirror.js` and `error-capture.js` at document start and
     * receives their messages through `window.streamHostBridge`. Falls back to
     * [ChromeClient.onConsoleMessage] on WebView builds without these features.
     */
    // Both features are checked up front; lint does not follow the early return.
    @SuppressLint("RequiresFeature")
    private fun installPageScripts(wv: WebView, chromeClient: ChromeClient) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER) ||
            !WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)
        ) {
            chromeClient.mirrorConsoleMessages = true
            AppState.log(LogTab.ERRORS, "webview", "document-start scripts unsupported; using onConsoleMessage")
            return
        }
        WebViewCompat.addWebMessageListener(wv, BRIDGE_OBJECT, setOf("*")) { _, message, _, _, _ ->
            message.data?.let(::handlePageMessage)
        }
        for (name in listOf("console-mirror", "error-capture")) {
            val source = runCatching {
                context.assets.open("WebScripts/$name.js").bufferedReader().use { it.readText() }
            }.getOrNull()
            if (source == null) {
                AppState.log(LogTab.ERRORS, "webview", "missing assets/WebScripts/$name.js")
                continue
            }
            WebViewCompat.addDocumentStartJavaScript(wv, source, setOf("*"))
        }
    }

    private fun handlePageMessage(data: String) {
        val body = runCatching { JSONObject(data) }.getOrNull() ?: return
        when (body.optString("type")) {
            "console" -> {
                val args = body.optJSONArray("args")
                val message = (0 until (args?.length() ?: 0)).joinToString(" ") { args!!.optString(it) }
                AppState.log(LogTab.CONSOLE, body.optString("level", "log"), message)
            }
            "error" -> {
                val kind = body.optString("kind", "error")
                val source = body.optString("source")
                val stack = body.optString("stack")
                val line = listOfNotNull(
                    kind.uppercase(),
                    body.optString("message"),
                    source.takeIf { it.isNotEmpty() }?.let { "@$it" },
                    stack.takeIf { it.isNotEmpty() }?.let { "\n$it" },
                ).joinToString(" ")
                AppState.log(LogTab.ERRORS, kind, line)
            }
        }
    }

    private fun handleRenderProcessGone(crashed: WebView) {
        if (crashed !== webView) return
        dispose(crashed)
        webView = createWebView().also(::attach)
        AppState.log(LogTab.SCENARIOS, "webview", "created a new WebView; tap ↻ to reload the last URL")
    }

    private fun attach(wv: WebView) {
        container.addView(
            wv,
            FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT),
        )
    }

    private fun dispose(wv: WebView) {
        wv.releaseStreamVideoHostBridge()
        (wv.parent as? ViewGroup)?.removeView(wv)
        wv.destroy()
    }

    private companion object {
        const val BRIDGE_OBJECT = "streamHostBridge"
    }
}
