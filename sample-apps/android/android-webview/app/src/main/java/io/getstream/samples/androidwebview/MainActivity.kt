package io.getstream.samples.androidwebview

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.mutableStateOf
import io.getstream.samples.androidwebview.scenarios.AudioScenarios
import io.getstream.samples.androidwebview.ui.ContentScreen
import io.getstream.samples.androidwebview.webview.WebController

class MainActivity : ComponentActivity() {
    private lateinit var web: WebController
    private lateinit var audioScenarios: AudioScenarios
    private val pendingPermissionCallbacks = mutableListOf<() -> Unit>()
    private val launchUrl = mutableStateOf<String?>(null)

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { results ->
        results.forEach { (permission, granted) ->
            AppState.log(LogTab.SCENARIOS, "perm", "${permission.substringAfterLast('.')} granted=$granted")
        }
        web.refreshHostBridgePermissions()
        val callbacks = pendingPermissionCallbacks.toList()
        pendingPermissionCallbacks.clear()
        callbacks.forEach { it() }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WebView.setWebContentsDebuggingEnabled(true)

        web = WebController(this, ::requestPermissions)
        audioScenarios = AudioScenarios(this)
        launchUrl.value = intent?.dataString

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.goBack()) return
                isEnabled = false
                onBackPressedDispatcher.onBackPressed()
            }
        })

        setContent {
            MaterialTheme(colorScheme = if (isSystemInDarkTheme()) darkColorScheme() else lightColorScheme()) {
                ContentScreen(web = web, audio = audioScenarios, launchUrl = launchUrl.value)
            }
        }

        if (savedInstanceState == null) requestPermissions(startupPermissions()) {}
    }

    /** `adb shell am start -d <url> ...` loads the URL without typing it. */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.dataString?.let { launchUrl.value = it }
    }

    override fun onDestroy() {
        audioScenarios.release()
        web.destroy()
        super.onDestroy()
    }

    private fun requestPermissions(permissions: Array<String>, onResult: () -> Unit) {
        pendingPermissionCallbacks += onResult
        permissionLauncher.launch(permissions)
    }

    private fun startupPermissions(): Array<String> = buildList {
        add(Manifest.permission.CAMERA)
        add(Manifest.permission.RECORD_AUDIO)
        add(Manifest.permission.READ_PHONE_STATE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) add(Manifest.permission.POST_NOTIFICATIONS)
    }.toTypedArray()
}
