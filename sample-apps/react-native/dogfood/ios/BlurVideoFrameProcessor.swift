import Foundation

final class BlurVideoFrameProcessor: VideoFilter {
    @available(*, unavailable)
    override public init(
        filter: @escaping (Input) -> CIImage
    ) { fatalError() }
    
    init() {
        super.init(
            filter: { input in
                let filter = CIFilter(name: "CIGaussianBlur")
                filter?.setValue(input.originalImage, forKey: kCIInputImageKey)
                filter?.setValue(50.0, forKey: kCIInputRadiusKey)
                
                let outputImage: CIImage = filter?.outputImage ?? input.originalImage
                return outputImage
            }
        )
    }
}