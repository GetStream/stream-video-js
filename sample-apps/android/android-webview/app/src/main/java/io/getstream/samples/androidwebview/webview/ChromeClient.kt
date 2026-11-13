package io.getstream.samples.androidwebview.webview

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import androidx.core.graphics.createBitmap
import android.webkit.ConsoleMessage
import android.webkit.JsResult
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.core.content.ContextCompat
import io.getstream.samples.androidwebview.AppState
import io.getstream.samples.androidwebview.LogTab

typealias PermissionRequester = (permissions: Array<String>, onResult: () -> Unit) -> Unit

/**
 * Grants camera/microphone to the embedded page. WebView only exposes a
 * capture resource to `getUserMedia` after the app itself holds the matching
 * runtime permission, so missing permissions are requested first.
 */
class ChromeClient(
    private val context: Context,
    private val requestPermissions: PermissionRequester,
) : WebChromeClient() {

    /**
     * Mirrors `console.*` through [onConsoleMessage]. Only used when the
     * document-start script bridge is unavailable on this WebView version.
     */
    var mirrorConsoleMessages: Boolean = false

    override fun onPermissionRequest(request: PermissionRequest) {
        val missing = request.resources
            .mapNotNull(::permissionFor)
            .distinct()
            .filterNot(::isGranted)
        if (missing.isEmpty()) {
            grant(request)
        } else {
            AppState.log(LogTab.SCENARIOS, "perm", "requesting ${missing.joinToString()}")
            requestPermissions(missing.toTypedArray()) { grant(request) }
        }
    }

    override fun onPermissionRequestCanceled(request: PermissionRequest) {
        AppState.log(LogTab.SCENARIOS, "perm", "request canceled by ${request.origin}")
    }

    override fun onJsAlert(view: WebView, url: String, message: String, result: JsResult): Boolean {
        AppState.log(LogTab.CONSOLE, "alert", message)
        result.confirm()
        return true
    }

    override fun onJsConfirm(view: WebView, url: String, message: String, result: JsResult): Boolean {
        AppState.log(LogTab.CONSOLE, "confirm", message)
        result.confirm()
        return true
    }

    override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
        if (mirrorConsoleMessages) {
            val level = when (consoleMessage.messageLevel()) {
                ConsoleMessage.MessageLevel.ERROR -> "error"
                ConsoleMessage.MessageLevel.WARNING -> "warn"
                ConsoleMessage.MessageLevel.DEBUG -> "debug"
                ConsoleMessage.MessageLevel.TIP -> "info"
                else -> "log"
            }
            AppState.log(LogTab.CONSOLE, level, consoleMessage.message())
        }
        return false
    }

    /** Avoids WebView's grey play-button placeholder on `<video>` elements. */
    override fun getDefaultVideoPoster(): Bitmap = createBitmap(1, 1)

    private fun grant(request: PermissionRequest) {
        val allowed = request.resources
            .filter { resource -> permissionFor(resource)?.let(::isGranted) == true }
            .toTypedArray()
        if (allowed.isEmpty()) {
            AppState.log(LogTab.ERRORS, "perm", "deny ${describe(request.resources)} to ${request.origin}")
            request.deny()
            return
        }
        AppState.log(LogTab.SCENARIOS, "perm", "grant ${describe(allowed)} to ${request.origin}")
        request.grant(allowed)
    }

    private fun isGranted(permission: String): Boolean =
        ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

    private fun permissionFor(resource: String): String? = when (resource) {
        PermissionRequest.RESOURCE_VIDEO_CAPTURE -> Manifest.permission.CAMERA
        PermissionRequest.RESOURCE_AUDIO_CAPTURE -> Manifest.permission.RECORD_AUDIO
        else -> null
    }

    private fun describe(resources: Array<String>): String = resources.joinToString("+") {
        when (it) {
            PermissionRequest.RESOURCE_VIDEO_CAPTURE -> "camera"
            PermissionRequest.RESOURCE_AUDIO_CAPTURE -> "mic"
            else -> it
        }
    }
}
