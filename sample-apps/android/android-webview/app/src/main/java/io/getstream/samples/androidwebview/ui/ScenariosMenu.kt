package io.getstream.samples.androidwebview.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import io.getstream.samples.androidwebview.scenarios.AudioScenarios
import io.getstream.samples.androidwebview.webview.StreamVideoHostBridge
import io.getstream.samples.androidwebview.webview.WebController

/** Top-bar menu that bridges taps into [AudioScenarios] and [WebController]. */
@Composable
fun ScenariosMenu(audio: AudioScenarios, web: WebController) {
    var expanded by remember { mutableStateOf(false) }
    // Re-read on every open, like the iOS menu's live-state row.
    val liveState = remember(expanded) { if (expanded) audio.liveState() else "" }

    Box {
        TextButton(onClick = { expanded = true }) { Text("Scenarios") }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.widthIn(max = 340.dp),
        ) {
            val item = @Composable { label: String, action: () -> Unit ->
                DropdownMenuItem(
                    text = { Text(label) },
                    onClick = {
                        expanded = false
                        action()
                    },
                )
            }

            SectionHeader("Audio state")
            Text(
                liveState,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
            )
            item("Dump state to Lifecycle") { audio.dumpState() }
            HorizontalDivider()

            item("Restore audio (native)") { audio.restoreForWebRTC() }
            HorizontalDivider()

            SectionHeader("🎛 Set mode")
            AudioScenarios.allModes.forEach { mode ->
                item("  ${StreamVideoHostBridge.modeName(mode)}") { audio.setMode(mode) }
            }
            HorizontalDivider()

            SectionHeader("Sounds")
            item("Play ding (mix)") { audio.playDingMix() }
            item("Play ding (exclusive)") { audio.playDingExclusive() }
            item("Play ding (exclusive, auto-restore)") { audio.playDingWithAutoRestore() }
            item("Play ding (exclusive, NO restore)") { audio.playDingExclusiveNoRestore() }
            if (audio.ringtonePlaying) {
                item("Stop ringtone") { audio.stopRingtone() }
            } else {
                item("Ringtone loop") { audio.startRingtone() }
            }
            item("Notification with sound (2s)") { audio.scheduleNotification() }
            HorizontalDivider()

            SectionHeader("Android")
            if (audio.micCaptureRunning) {
                item("Stop second mic capture") { audio.stopMicCapture() }
            } else {
                item("Start second mic capture (meter)") { audio.startMicCapture() }
            }
            item("Toggle route (speaker ↔ earpiece)") { audio.toggleRoute() }
            if (audio.foregroundServiceRunning) {
                item("Stop foreground service") { audio.stopForegroundService() }
            } else {
                item("Start foreground service (mic|camera)") { audio.startForegroundService() }
            }
            item("Crash renderer") { web.crashRenderer() }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
    )
}
