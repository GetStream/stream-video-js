package io.getstream.rn.callingx.utils

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.LifecycleState

object LifecycleListener : LifecycleEventListener {

    @Volatile
    var isInForeground: Boolean = false
        private set

    private var registered: Boolean = false
    private var currentContext: ReactApplicationContext? = null

    fun register(context: ReactApplicationContext) {
        if (registered) return
        registered = true
        currentContext = context
        context.addLifecycleEventListener(this)
        isInForeground = context.lifecycleState == LifecycleState.RESUMED
    }

    fun unregister() {
        currentContext?.removeLifecycleEventListener(this)
        currentContext = null
        registered = false
        isInForeground = false
    }

    override fun onHostResume() {
        isInForeground = true
    }

    override fun onHostPause() {
        isInForeground = false
    }

    override fun onHostDestroy() {
        isInForeground = false
    }
}
