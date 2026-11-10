package io.getstream.samples.androidwebview

import android.Manifest
import android.content.Intent
import android.content.pm.ApplicationInfo
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
import io.getstream.samples.androidwebview.scenarios.NetworkScenarios
import io.getstream.samples.androidwebview.ui.ContentScreen
import io.getstream.samples.androidwebview.ui.LaunchRequest
import io.getstream.samples.androidwebview.webview.AutomationRouter
import io.getstream.samples.androidwebview.webview.WebController

class MainActivity : ComponentActivity() {
    private lateinit var web: WebController
    private lateinit var audioScenarios: AudioScenarios
    private lateinit var networkScenarios: NetworkScenarios
    private lateinit var automation: AutomationRouter
    private val pendingPermissionCallbacks = mutableListOf<() -> Unit>()
    private val launchRequest = mutableStateOf<LaunchRequest?>(null)
    private var nextLaunchId = 0L

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
        networkScenarios = NetworkScenarios(web)
        automation = AutomationRouter(web, audioScenarios, networkScenarios, ::requestLoad)
        handleIntent(intent)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.goBack()) return
                isEnabled = false
                onBackPressedDispatcher.onBackPressed()
            }
        })

        setContent {
            MaterialTheme(colorScheme = if (isSystemInDarkTheme()) darkColorScheme() else lightColorScheme()) {
                ContentScreen(
                    web = web,
                    audio = audioScenarios,
                    network = networkScenarios,
                    launchRequest = launchRequest.value,
                )
            }
        }

        if (savedInstanceState == null) requestPermissions(startupPermissions()) {}
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    /**
     * `adb shell am start -d <url> ...` loads the URL without typing it, and a
     * debug build routes `androidwebview://` commands to [AutomationRouter].
     */
    private fun handleIntent(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != AutomationRouter.SCHEME) return requestLoad(data.toString())
        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) {
            automation.handle(data)
        } else {
            AppState.log(LogTab.ERRORS, "automation", "commands are only available in debug builds")
        }
    }

    private fun requestLoad(url: String) {
        launchRequest.value = LaunchRequest(url, nextLaunchId++)
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
