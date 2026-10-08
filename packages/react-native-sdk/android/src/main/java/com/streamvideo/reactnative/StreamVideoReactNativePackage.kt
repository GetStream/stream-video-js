package com.streamvideo.reactnative

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.streamvideo.reactnative.callmanager.StreamInCallManagerModule

class StreamVideoReactNativePackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        when (name) {
            NativeStreamVideoReactNativeSpec.NAME -> StreamVideoReactNativeModule(reactContext)
            NativeStreamVideoAppLifecycleSpec.NAME -> StreamVideoAppLifecycleModule(reactContext)
            NativeStreamInCallManagerSpec.NAME -> StreamInCallManagerModule(reactContext)
            else -> null
        }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
        mapOf(
            NativeStreamVideoReactNativeSpec.NAME to moduleInfo(NativeStreamVideoReactNativeSpec.NAME, isTurboModule = true),
            NativeStreamInCallManagerSpec.NAME to moduleInfo(NativeStreamInCallManagerSpec.NAME, isTurboModule = true),
            NativeStreamVideoAppLifecycleSpec.NAME to moduleInfo(NativeStreamVideoAppLifecycleSpec.NAME, isTurboModule = true),
        )
    }

    private fun moduleInfo(name: String, isTurboModule: Boolean) = ReactModuleInfo(
        name = name,
        className = name,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = isTurboModule,
    )
}
