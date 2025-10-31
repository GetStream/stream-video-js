package com.broadcast

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = BroadcastModule.NAME)
class BroadcastModule(reactContext: ReactApplicationContext) :
  NativeBroadcastSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  // Promise-based method to match TurboModule spec
  override fun multiply(a: Double, b: Double, promise: Promise) {
    try {
      promise.resolve(a * b)
    } catch (e: Exception) {
      promise.reject("multiply_error", e)
    }
  }

  companion object {
    const val NAME = "Broadcast"
  }
}
