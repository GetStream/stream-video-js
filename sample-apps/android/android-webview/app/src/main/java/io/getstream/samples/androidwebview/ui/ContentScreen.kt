package io.getstream.samples.androidwebview.ui

import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.edit
import io.getstream.samples.androidwebview.AppState
import io.getstream.samples.androidwebview.LogTab
import io.getstream.samples.androidwebview.scenarios.AudioScenarios
import io.getstream.samples.androidwebview.webview.WebController

private const val PREFS = "settings"
private const val LAST_URL_KEY = "lastURL"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContentScreen(web: WebController, audio: AudioScenarios, launchUrl: String?) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE) }
    var urlText by remember { mutableStateOf(prefs.getString(LAST_URL_KEY, "") ?: "") }
    var debugExpanded by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current

    val loadUrl = {
        var text = urlText.trim()
        if (text.isNotEmpty()) {
            if (!text.contains("://")) text = "https://$text"
            urlText = text
            prefs.edit { putString(LAST_URL_KEY, text) }
            focusManager.clearFocus()
            web.load(text)
        } else {
            AppState.log(LogTab.ERRORS, "url", "empty URL")
        }
    }

    LaunchedEffect(launchUrl) {
        if (launchUrl != null) {
            urlText = launchUrl
            loadUrl()
        }
    }

    Scaffold(
        modifier = Modifier.imePadding(),
        topBar = {
            TopAppBar(
                title = { Text("AndroidWebView") },
                actions = { ScenariosMenu(audio = audio, web = web) },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedTextField(
                    value = urlText,
                    onValueChange = { urlText = it },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    placeholder = { Text("http://localhost:5173") },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        autoCorrectEnabled = false,
                        imeAction = ImeAction.Go,
                    ),
                    keyboardActions = KeyboardActions(onGo = { loadUrl() }),
                )
                Button(onClick = loadUrl, modifier = Modifier.padding(top = 4.dp)) { Text("Load") }
                Button(onClick = web::reload, modifier = Modifier.padding(top = 4.dp)) { Text("↻") }
            }
            Box(Modifier.weight(1f).fillMaxWidth()) {
                AndroidView(factory = { web.container }, modifier = Modifier.fillMaxSize())
            }
            DebugOverlay(expanded = debugExpanded, onToggle = { debugExpanded = !debugExpanded })
        }
    }
}
