package com.streamvideo.reactnative.audio.utils

import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

// https://stackoverflow.com/a/47948047
// A lazy var
@Suppress("ClassName")
class LazyMutable<T>(val initializer: () -> T) : ReadWriteProperty<Any?, T> {
    private var prop: Any? = UNINITIALIZED_VALUE

    @Suppress("UNCHECKED_CAST")
    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        return if (prop == UNINITIALIZED_VALUE) {
            synchronized(this) {
                return if (prop == UNINITIALIZED_VALUE) initializer().also { prop = it } else prop as T
            }
        } else prop as T
    }

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        synchronized(this) {
            prop = value
        }
    }

    companion object {
        private object UNINITIALIZED_VALUE
    }
}
