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
            // `self.filter` is stored on `self`; capture weakly to avoid a retain cycle
            // that would otherwise leak the processor (including its CIContext, Vision
            // handler, and NotificationCenter observer) for the lifetime of the app.
            guard let self = self else { return input.originalImage }
            // Blur at half-resolution (4× cheaper) then upscale, mirroring the Android path.
            // `clampedToExtent` avoids transparent edges from the blur kernel sampling
            // past the image border; `cropped(to:)` undoes the extent expansion that
            // CIGaussianBlur applies, so the upscale maps the background 1:1 back onto
            // the original frame — without it the background slides relative to the
            // foreground mask.
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
