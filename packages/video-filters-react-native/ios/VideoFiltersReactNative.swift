@objc(VideoFiltersReactNative)
class VideoFiltersReactNative: NSObject {
    
    @available(iOS 15.0, *)
    @objc(registerBackgroundBlurVideoFilters:withRejecter:)
    func registerBackgroundBlurVideoFilters(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.light), forName: "BackgroundBlurLight")
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.medium), forName: "BackgroundBlurMedium")
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.heavy), forName: "BackgroundBlurHeavy")
        resolve(true)
    }
    
    @available(iOS 15.0, *)
    @objc(registerVirtualBackgroundFilter:withResolver:withRejecter:)
    func registerVirtualBackgroundFilter(backgroundImageUrlString: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        ProcessorProvider.addProcessor(ImageBackgroundVideoFrameProcessor(backgroundImageUrlString), forName: "VirtualBackground-\(backgroundImageUrlString)")
        resolve(true)
    }
}
