package io.getstream.rn.callingx

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class CallingPackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
            if (name == CallingxModule.NAME) CallingxModule(reactContext) else null

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
        mapOf(
                CallingxModule.NAME to
                        ReactModuleInfo(
                                name = CallingxModule.NAME,
                                className = CallingxModule.NAME,
                                canOverrideExistingModule = false,
                                needsEagerInit = false,
                                isCxxModule = false,
                                isTurboModule = true
                        )
        )
    }
}
