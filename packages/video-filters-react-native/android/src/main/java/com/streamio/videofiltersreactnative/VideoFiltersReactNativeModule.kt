package com.streamio.videofiltersreactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.oney.WebRTCModule.videoEffects.ProcessorProvider
import com.streamio.videofiltersreactnative.factories.*

class VideoFiltersReactNativeModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  // Tracks names registered with the global `ProcessorProvider` so we can drop
  // them on `unregisterAllFilters`. Without this, factories accumulate for the
  // life of the app.
  private val registeredNames = mutableSetOf<String>()

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun addListener(eventName: String?) {
  }

  @ReactMethod
  fun removeListeners(count: Int) {
  }

  @ReactMethod
  fun registerBackgroundBlurVideoFilters(promise: Promise) {
    ProcessorProvider.addProcessor(
      "BackgroundBlurLight",
      BackgroundBlurFactory(BlurIntensity.LIGHT)
    )
    ProcessorProvider.addProcessor(
      "BackgroundBlurMedium",
      BackgroundBlurFactory(BlurIntensity.MEDIUM)
    )
    ProcessorProvider.addProcessor(
      "BackgroundBlurHeavy",
      BackgroundBlurFactory(BlurIntensity.HEAVY)
    )
    registeredNames.addAll(listOf("BackgroundBlurLight", "BackgroundBlurMedium", "BackgroundBlurHeavy"))
    promise.resolve(true)
  }

  @ReactMethod
  fun registerVirtualBackgroundFilter(backgroundImageUrlString: String, promise: Promise) {
    val name = "VirtualBackground-$backgroundImageUrlString"
    ProcessorProvider.addProcessor(
      name,
      VirtualBackgroundFactory(reactApplicationContext, backgroundImageUrlString)
    )
    registeredNames.add(name)
    promise.resolve(true)
  }

  @ReactMethod
  fun registerBlurVideoFilters(promise: Promise) {
    ProcessorProvider.addProcessor("BlurLight", VideoBlurFactory(VideoBlurIntensity.LIGHT))
    ProcessorProvider.addProcessor("BlurMedium", VideoBlurFactory(VideoBlurIntensity.MEDIUM))
    ProcessorProvider.addProcessor("BlurHeavy", VideoBlurFactory(VideoBlurIntensity.HEAVY))
    registeredNames.addAll(listOf("BlurLight", "BlurMedium", "BlurHeavy"))
    promise.resolve(true)
  }

  @ReactMethod
  fun unregisterAllFilters(promise: Promise) {
    for (name in registeredNames) {
      ProcessorProvider.removeProcessor(name)
    }
    registeredNames.clear()
    promise.resolve(true)
  }

  companion object {
    const val NAME = "VideoFiltersReactNative"
  }
}
