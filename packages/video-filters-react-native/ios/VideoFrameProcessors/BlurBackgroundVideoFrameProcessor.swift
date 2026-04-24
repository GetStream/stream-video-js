import Foundation

@available(iOS 15.0, *)
final class BlurBackgroundVideoFrameProcessor: VideoFilter {

    @available(*, unavailable)
    override public init(
        filter: @escaping (Input) -> CIImage
    ) { fatalError() }
    
    private lazy var backgroundImageFilterProcessor = { return BackgroundImageFilterProcessor() }()
    
    private let blurParameters: [String : Float]
    
    init(blurIntensity: BlurIntensity = BlurIntensity.medium) {
        blurParameters = ["inputRadius": blurIntensity.rawValue]
        
        super.init(
            filter: { input in input.originalImage }
        )
        
        self.filter = { [weak self] input in
            // `[weak self]`: the closure is stored on `self` — a strong capture would leak the processor.
            guard let self = self else { return input.originalImage }
            // Blur at half resolution for speed.
            // `clampedToExtent` + `cropped(to:)` keep the blurred image at the input's
            // extent; without it the upscaled background drifts relative to the foreground.
            let originalExtent = input.originalImage.extent
            let halfSize = CGSize(width: originalExtent.width / 2, height: originalExtent.height / 2)
            let downscaled = input.originalImage.resize(halfSize) ?? input.originalImage
            let blurred = downscaled
                .clampedToExtent()
                .applyingFilter("CIGaussianBlur", parameters: self.blurParameters)
                .cropped(to: downscaled.extent)
            let backgroundImage = blurred.resize(originalExtent.size) ?? blurred

            return self.backgroundImageFilterProcessor
                .applyFilter(
                    input.originalPixelBuffer,
                    backgroundImage: backgroundImage
                ) ?? input.originalImage
        }
    }
}

enum BlurIntensity: Float {
    case light = 5.0
    case medium = 10.0
    case heavy = 15.0
}
