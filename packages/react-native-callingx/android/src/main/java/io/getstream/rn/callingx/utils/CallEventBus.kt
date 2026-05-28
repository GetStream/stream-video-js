package io.getstream.rn.callingx

import android.os.Bundle

data class CallEvent(val action: String, val extras: Bundle)

object CallEventBus {

    interface Listener {
        fun onCallEvent(event: CallEvent)
    }

    private val pendingEvents = mutableListOf<CallEvent>()
    private var listener: Listener? = null
    private var isJsReady: Boolean = false

    @JvmStatic
    @Synchronized
    fun publish(event: CallEvent) {
        val currentListener = listener
        if (currentListener != null && isJsReady) {
            currentListener.onCallEvent(event)
        } else {
            pendingEvents.add(event)
        }
    }

    @JvmStatic
    @Synchronized
    fun subscribe(listener: Listener) {
        this.listener = listener
    }

    @JvmStatic
    @Synchronized
    fun unsubscribe(listener: Listener) {
        if (this.listener === listener) {
            this.listener = null
            isJsReady = false
            pendingEvents.clear()
        }
    }

    @JvmStatic
    @Synchronized
    fun drainPendingEvents(): List<CallEvent> {
        if (pendingEvents.isEmpty()) {
            return emptyList()
        }
        val copy = pendingEvents.toList()
        pendingEvents.clear()
        return copy
    }

    @JvmStatic
    @Synchronized
    fun markJsReady() {
        isJsReady = true
    }
}

