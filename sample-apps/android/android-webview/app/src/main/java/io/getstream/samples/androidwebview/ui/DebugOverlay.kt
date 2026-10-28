package io.getstream.samples.androidwebview.ui

import android.content.ClipData
import android.content.ClipboardManager
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.getstream.samples.androidwebview.AppState
import io.getstream.samples.androidwebview.LogEntry
import io.getstream.samples.androidwebview.LogTab
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Collapsible bottom panel with tabbed log views backed by [AppState.entries]. */
@Composable
fun DebugOverlay(expanded: Boolean, onToggle: () -> Unit) {
    var selectedTab by remember { mutableStateOf(LogTab.CONSOLE) }
    val visible by remember { derivedStateOf { AppState.entries.filter { it.tab == selectedTab } } }
    val context = LocalContext.current

    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
            .background(Color.Black.copy(alpha = 0.85f))
            .navigationBarsPadding()
            .animateContentSize(),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .height(40.dp)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            HeaderButton(if (expanded) "▼ Debug" else "▲ Debug", bold = true, onClick = onToggle)
            Row(
                Modifier.weight(1f).horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                LogTab.entries.forEach { tab ->
                    HeaderButton(
                        tab.label,
                        selected = tab == selectedTab,
                        onClick = { selectedTab = tab },
                    )
                }
            }
            HeaderButton("Copy") {
                val text = visible.joinToString("\n", transform = ::format)
                context.getSystemService(ClipboardManager::class.java)
                    .setPrimaryClip(ClipData.newPlainText("${selectedTab.label} log", text))
            }
            HeaderButton("Clear") { AppState.clear(selectedTab) }
        }
        if (expanded) LogList(visible)
    }
}

@Composable
private fun LogList(visible: List<LogEntry>) {
    val listState = rememberLazyListState()
    LaunchedEffect(visible.size) {
        if (visible.isNotEmpty()) listState.scrollToItem(visible.lastIndex)
    }
    SelectionContainer {
        LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp)
                .padding(horizontal = 8.dp),
        ) {
            items(visible, key = { it.id }) { entry ->
                Text(
                    format(entry),
                    color = Color.White,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    lineHeight = 14.sp,
                )
            }
        }
    }
}

@Composable
private fun HeaderButton(
    title: String,
    selected: Boolean = false,
    bold: Boolean = false,
    onClick: () -> Unit,
) {
    Text(
        title,
        modifier = Modifier.clickable(onClick = onClick),
        color = if (selected) Color(0xFF6CB4FF) else Color.White,
        fontFamily = FontFamily.Monospace,
        fontWeight = if (selected || bold) FontWeight.Bold else FontWeight.Normal,
        fontSize = 12.sp,
        maxLines = 1,
    )
}

private val timeFormat = SimpleDateFormat("HH:mm:ss.SSS", Locale.US)

private fun format(entry: LogEntry): String =
    "[${timeFormat.format(Date(entry.timestamp))}] ${entry.level}: ${entry.message}"
