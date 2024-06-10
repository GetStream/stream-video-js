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
        blurParameters = ["inputRadius": blurIntensity.radius]
        
        super.init(
            filter: { input in input.originalImage }
        )
        
        self.filter = { input in
            // https://developer.apple.com/library/archive/documentation/GraphicsImaging/Reference/CoreImageFilterReference/index.html#//apple_ref/doc/filter/ci/CIGaussianBlur
            let backgroundImage = input.originalImage.applyingFilter("CIGaussianBlur", parameters: self.blurParameters)
            
            return self.backgroundImageFilterProcessor
                .applyFilter(
                    input.originalPixelBuffer,
                    backgroundImage: backgroundImage
                ) ?? input.originalImage
        }
    }
}

enum BlurIntensity: String {
    case light = "LIGHT"
    case medium = "MEDIUM"
    case heavy = "HEAVY"
    
    var radius: Float {
        switch self {
        case .light:
            return 5.0
        case .medium:
            return 10.0
        case .heavy:
            return 15.0
        }
    }
}
