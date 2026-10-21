package com.streamio.videofiltersreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.oney.WebRTCModule.videoEffects.ProcessorProvider
import com.streamio.videofiltersreactnative.factories.*

class VideoFiltersReactNativeModule(reactContext: ReactApplicationContext) :
  NativeVideoFiltersReactNativeSpec(reactContext) {

  // Names we add to the global ProcessorProvider, so unregisterAllFilters can
  // release them. Otherwise factories accumulate for the app's lifetime.
  private val registeredNames = mutableSetOf<String>()

  override fun registerBackgroundBlurVideoFilters(): Boolean {
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
    return true
  }

  override fun registerVirtualBackgroundFilter(backgroundImageUrlString: String): Boolean {
    val name = "VirtualBackground-$backgroundImageUrlString"
    ProcessorProvider.addProcessor(
      name,
      VirtualBackgroundFactory(reactApplicationContext, backgroundImageUrlString)
    )
    registeredNames.add(name)
    return true
  }

  override fun registerBlurVideoFilters(): Boolean {
    ProcessorProvider.addProcessor("BlurLight", VideoBlurFactory(VideoBlurIntensity.LIGHT))
    ProcessorProvider.addProcessor("BlurMedium", VideoBlurFactory(VideoBlurIntensity.MEDIUM))
    ProcessorProvider.addProcessor("BlurHeavy", VideoBlurFactory(VideoBlurIntensity.HEAVY))
    registeredNames.addAll(listOf("BlurLight", "BlurMedium", "BlurHeavy"))
    return true
  }

  override fun unregisterAllFilters(): Boolean {
    for (name in registeredNames) {
      ProcessorProvider.removeProcessor(name)
    }
    registeredNames.clear()
    return true
  }

  companion object {
    const val NAME = NativeVideoFiltersReactNativeSpec.NAME
  }
}
