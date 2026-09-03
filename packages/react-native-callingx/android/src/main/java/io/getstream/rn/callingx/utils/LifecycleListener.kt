package io.getstream.rn.callingx.utils

import android.util.Log
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.LifecycleState
import java.util.concurrent.CopyOnWriteArrayList

object LifecycleListener : LifecycleEventListener {

    private const val TAG = "[Callingx] LifecycleListener"

    @Volatile
    var isInForeground: Boolean = false
        private set

    private var registered: Boolean = false
    private var currentContext: ReactApplicationContext? = null

    private val foregroundListeners = CopyOnWriteArrayList<Runnable>()

    fun addOnForegroundListener(listener: Runnable) {
        foregroundListeners.addIfAbsent(listener)
    }

    fun removeOnForegroundListener(listener: Runnable) {
        foregroundListeners.remove(listener)
    }

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
        // Notify after isInForeground is set so listeners observe the foreground state.
        foregroundListeners.forEach { listener ->
            try {
                listener.run()
            } catch (e: Throwable) {
                Log.w(TAG, "foreground listener threw: ${e.message}")
            }
        }
    }

    override fun onHostPause() {
        isInForeground = false
    }

    override fun onHostDestroy() {
        isInForeground = false
    }
}
