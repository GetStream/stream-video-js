import Foundation

@available(iOS 15.0, *)
final class BlurVideoFrameProcessor: VideoFilter {
    @available(*, unavailable)
    override public init(
        filter: @escaping (Input) -> CIImage
    ) { fatalError() }
    
    init(blurIntensity: VideoBlurIntensity = VideoBlurIntensity.medium) {
        super.init(
            filter: { input in
                let filter = CIFilter(name: "CIGaussianBlur")
                filter?.setValue(input.originalImage, forKey: kCIInputImageKey)
                filter?.setValue(blurIntensity.rawValue, forKey: kCIInputRadiusKey)
                
                let outputImage: CIImage = filter?.outputImage ?? input.originalImage
                return outputImage
            }
        )
    }
}

enum VideoBlurIntensity: Float {
    case light = 5.0
    case medium = 15.0
    case heavy = 30.0
}