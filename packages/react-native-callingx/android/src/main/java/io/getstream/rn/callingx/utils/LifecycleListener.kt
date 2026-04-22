package io.getstream.rn.callingx.utils

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.LifecycleState

object LifecycleListener : LifecycleEventListener {

    @Volatile
    var isInForeground: Boolean = false
        private set

    private var registered: Boolean = false

    fun register(context: ReactApplicationContext) {
        if (registered) return
        registered = true
        context.addLifecycleEventListener(this)
        isInForeground = context.lifecycleState == LifecycleState.RESUMED
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
