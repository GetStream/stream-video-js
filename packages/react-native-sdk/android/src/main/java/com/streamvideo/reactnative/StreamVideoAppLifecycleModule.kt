package com.streamvideo.reactnative

import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ProcessLifecycleOwner
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Emits application *process* lifecycle changes using ProcessLifecycleOwner.
 *
 * Based on:
 * https://developer.android.com/reference/androidx/lifecycle/ProcessLifecycleOwner
 *
 * Notes:
 * - ON_CREATE is dispatched once and ON_DESTROY is never dispatched.
 * - ON_STOP / ON_PAUSE are dispatched with a delay after the last activity stops/pauses.
 */
class StreamVideoAppLifecycleModule(reactContext: ReactApplicationContext) :
    NativeStreamVideoAppLifecycleSpec(reactContext) {

    private var observer: LifecycleEventObserver? = null

    override fun initialize() {
        super.initialize()

        val lifecycle = ProcessLifecycleOwner.get().lifecycle
        val lifecycleObserver = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> emitAppState("active")
                Lifecycle.Event.ON_STOP -> emitAppState("background")
                else -> Unit
            }
        }
        observer = lifecycleObserver
        reactApplicationContext.runOnUiQueueThread {
            lifecycle.addObserver(lifecycleObserver)
        }
    }

    override fun invalidate() {
        observer?.let {
            reactApplicationContext.runOnUiQueueThread {
                ProcessLifecycleOwner.get().lifecycle.removeObserver(it)
            }
        }
        observer = null
        super.invalidate()
    }

    private fun emitAppState(appState: String) {
        // addObserver replays the current state right away, which can run before the JSI wrapper sets the
        // emitter callback (it is set after initialize()); JS reads the initial state via getCurrentAppState
        if (mEventEmitterCallback == null) return
        emitOnAppStateChanged(appState)
    }

    override fun getCurrentAppState(): String {
        val state = ProcessLifecycleOwner.get().lifecycle.currentState
        return if (state.isAtLeast(Lifecycle.State.STARTED)) "active" else "background"
    }
}
