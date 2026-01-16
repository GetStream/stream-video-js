package com.streamvideo.reactnative

import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ProcessLifecycleOwner
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter

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
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

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
        reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit(APP_STATE_CHANGED_EVENT, appState)
    }

    @ReactMethod
    fun getCurrentAppState(promise: Promise) {
        val state = ProcessLifecycleOwner.get().lifecycle.currentState
        val appState = if (state.isAtLeast(Lifecycle.State.STARTED)) "active" else "background"
        promise.resolve(appState)
    }

    @Suppress("UNUSED_PARAMETER")
    @ReactMethod
    fun addListener(eventName: String?) {
        // Required for RN NativeEventEmitter
    }

    @Suppress("UNUSED_PARAMETER")
    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN NativeEventEmitter
    }

    companion object {
        private const val NAME = "StreamVideoAppLifecycle"
        private const val APP_STATE_CHANGED_EVENT = NAME + "_APP_STATE_CHANGED"
    }
}

