@objc(VideoFiltersReactNativeImpl)
public final class VideoFiltersReactNativeImpl: NSObject {

    // Names we add to the global ProcessorProvider, so unregisterAllFilters can
    // release them. Otherwise the processors live for the app's lifetime.
    private static var registeredNames = Set<String>()

    @objc public func registerBackgroundBlurVideoFilters() {
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.light), forName: "BackgroundBlurLight")
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.medium), forName: "BackgroundBlurMedium")
        ProcessorProvider.addProcessor(BlurBackgroundVideoFrameProcessor(blurIntensity: BlurIntensity.heavy), forName: "BackgroundBlurHeavy")
        Self.registeredNames.formUnion(["BackgroundBlurLight", "BackgroundBlurMedium", "BackgroundBlurHeavy"])
    }

    @objc public func registerVirtualBackgroundFilter(_ backgroundImageUrlString: String) {
        let name = "VirtualBackground-\(backgroundImageUrlString)"
        ProcessorProvider.addProcessor(ImageBackgroundVideoFrameProcessor(backgroundImageUrlString), forName: name)
        Self.registeredNames.insert(name)
    }

    @objc public func registerBlurVideoFilters() {
        ProcessorProvider.addProcessor(BlurVideoFrameProcessor(blurIntensity: VideoBlurIntensity.light), forName: "BlurLight")
        ProcessorProvider.addProcessor(BlurVideoFrameProcessor(blurIntensity: VideoBlurIntensity.medium), forName: "BlurMedium")
        ProcessorProvider.addProcessor(BlurVideoFrameProcessor(blurIntensity: VideoBlurIntensity.heavy), forName: "BlurHeavy")
        Self.registeredNames.formUnion(["BlurLight", "BlurMedium", "BlurHeavy"])
    }

    @objc public func unregisterAllFilters() {
        for name in Self.registeredNames {
            ProcessorProvider.removeProcessor(name)
        }
        Self.registeredNames.removeAll()
    }
}
