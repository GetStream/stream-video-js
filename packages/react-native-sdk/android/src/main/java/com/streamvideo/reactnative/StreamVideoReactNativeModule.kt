package com.streamvideo.reactnative

import com.facebook.react.bridge.*


class StreamVideoReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "StreamVideoReactNative"
    }
}
