package io.getstream.rn.callingx

import com.facebook.react.bridge.WritableMap

interface CallingxEventEmitterAdapter {
    fun emitNewEvent(value: WritableMap)
}
