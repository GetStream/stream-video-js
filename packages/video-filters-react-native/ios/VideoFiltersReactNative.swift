@objc(VideoFiltersReactNative)
class VideoFiltersReactNative: NSObject {

    // Names we add to the global ProcessorProvider, so unregisterAllFilters can
    // release them. Otherwise the processors live for the app's lifetime.
    private static var registeredNames = Set<String>()

    @available(iOS 15.0, *)
    @objc(registerBackgroundBlurVideoFilters:withRejecter:)
    func registerBackgroundBlurVideoFilters(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.light), forName: "BackgroundBlurLight")
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.medium), forName: "BackgroundBlurMedium")
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.heavy), forName: "BackgroundBlurHeavy")
        Self.registeredNames.formUnion(["BackgroundBlurLight", "BackgroundBlurMedium", "BackgroundBlurHeavy"])
        resolve(true)
    }

    @available(iOS 15.0, *)
    @objc(registerVirtualBackgroundFilter:withResolver:withRejecter:)
    func registerVirtualBackgroundFilter(backgroundImageUrlString: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let name = "VirtualBackground-\(backgroundImageUrlString)"
        ProcessorProvider.addProcessor(ImageBackgroundVideoFrameProcessor(backgroundImageUrlString), forName: name)
        Self.registeredNames.insert(name)
        resolve(true)
    }

    @available(iOS 15.0, *)
    @objc(registerBlurVideoFilters:withRejecter:)
    func registerBlurVideoFilters(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        ProcessorProvider.addProcessor(BlurVideoFrameProcessor(blurIntensity: VideoBlurIntensity.light), forName: "BlurLight")
        ProcessorProvider.addProcessor(BlurVideoFrameProcessor(blurIntensity: VideoBlurIntensity.medium), forName: "BlurMedium")
        ProcessorProvider.addProcessor(BlurVideoFrameProcessor(blurIntensity: VideoBlurIntensity.heavy), forName: "BlurHeavy")
        Self.registeredNames.formUnion(["BlurLight", "BlurMedium", "BlurHeavy"])
        resolve(true)
    }

    @objc(unregisterAllFilters:withRejecter:)
    func unregisterAllFilters(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        for name in Self.registeredNames {
            ProcessorProvider.removeProcessor(name)
        }
        Self.registeredNames.removeAll()
        resolve(true)
    }
}
