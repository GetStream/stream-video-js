package com.streamio.videofiltersreactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.oney.WebRTCModule.videoEffects.ProcessorProvider
import com.streamio.videofiltersreactnative.factories.BackgroundBlurFactory
import com.streamio.videofiltersreactnative.factories.BlurIntensity
import com.streamio.videofiltersreactnative.factories.VirtualBackgroundFactory

class VideoFiltersReactNativeModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

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
    promise.resolve(true)
  }

  @ReactMethod
  fun registerVirtualBackgroundFilter(backgroundImageUrlString: String, promise: Promise) {
    ProcessorProvider.addProcessor(
      "VirtualBackground-$backgroundImageUrlString",
      VirtualBackgroundFactory(reactApplicationContext, backgroundImageUrlString)
    )
    promise.resolve(true)
  }

  companion object {
    const val NAME = "VideoFiltersReactNative"
  }
}
