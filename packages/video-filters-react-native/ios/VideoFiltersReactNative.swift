@objc(VideoFiltersReactNative)
class VideoFiltersReactNative: NSObject {
    
    @objc(multiply:withB:withResolver:withRejecter:)
    func multiply(a: Float, b: Float, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve(a*b)
    }
    
    
    @available(iOS 15.0, *)
    @objc func registerBackgroundBlurVideoFilters() {
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.light), forName: "BackgroundBlurLight")
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.medium), forName: "BackgroundBlurMedium")
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.heavy), forName: "BackgroundBlurHeavy")
    }
    
    @available(iOS 15.0, *)
    @objc func registerVirtualBackgroundFilter(_ backgroundImageUrlString: String) {
        ProcessorProvider.addProcessor(ImageBackgroundVideoFrameProcessor(backgroundImageUrlString), forName: "VirtualBackground-\(backgroundImageUrlString)")
    }
}
