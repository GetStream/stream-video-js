package io.getstream.samples.androidwebview.webview

import android.graphics.Bitmap
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import io.getstream.samples.androidwebview.AppState
import io.getstream.samples.androidwebview.LogTab

class NavigationClient(private val onRenderProcessGone: (WebView) -> Unit) : WebViewClient() {
    private var renderProcessGoneCount = 0

    override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
        AppState.log(LogTab.SCENARIOS, "webview", "page started $url")
    }

    override fun onPageFinished(view: WebView, url: String) {
        AppState.log(LogTab.SCENARIOS, "webview", "page finished $url")
    }

    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
        if (!request.isForMainFrame) return
        AppState.log(
            LogTab.ERRORS,
            "nav",
            "load failed: ${error.description} (code ${error.errorCode}) ${request.url}",
        )
    }

    override fun onReceivedHttpError(
        view: WebView,
        request: WebResourceRequest,
        errorResponse: WebResourceResponse,
    ) {
        if (!request.isForMainFrame) return
        AppState.log(LogTab.ERRORS, "nav", "HTTP ${errorResponse.statusCode} for ${request.url}")
    }

    /**
     * Called when the renderer process dies (OOM, crash, `chrome://crash`).
     * Returning `true` keeps the app alive; the crashed [WebView] can no
     * longer be used, so the owner must drop it and create a new one.
     */
    override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
        renderProcessGoneCount += 1
        AppState.log(
            LogTab.ERRORS,
            "webview",
            "renderer process gone (#$renderProcessGoneCount) didCrash=${detail.didCrash()} " +
                "priority=${detail.rendererPriorityAtExit()} last URL: ${view.url ?: "-"}",
        )
        onRenderProcessGone(view)
        return true
    }
}
