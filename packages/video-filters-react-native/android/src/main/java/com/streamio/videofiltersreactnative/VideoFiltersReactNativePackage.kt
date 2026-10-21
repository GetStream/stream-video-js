package com.streamio.videofiltersreactnative

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class VideoFiltersReactNativePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == VideoFiltersReactNativeModule.NAME) {
      VideoFiltersReactNativeModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      VideoFiltersReactNativeModule.NAME to ReactModuleInfo(
        name = VideoFiltersReactNativeModule.NAME,
        className = VideoFiltersReactNativeModule.NAME,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true
      )
    )
  }
}
