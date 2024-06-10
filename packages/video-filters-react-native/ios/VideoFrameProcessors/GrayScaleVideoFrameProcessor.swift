import Foundation

final class GrayScaleVideoFrameProcessor: NSObject, VideoFrameProcessorDelegate {
    
    private let context: CIContext
    
    override init() {
        context = CIContext(options: [CIContextOption.useSoftwareRenderer: false])
        super.init()
    }
    
    func capturer(_ capturer: RTCVideoCapturer!, didCapture frame: RTCVideoFrame!) -> RTCVideoFrame! {
        if let rtcCVPixelBuffer = frame.buffer as? RTCCVPixelBuffer {
            let pixelBuffer = rtcCVPixelBuffer.pixelBuffer
            
            CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
            let originalImage = CIImage(cvPixelBuffer: pixelBuffer)
            // https://developer.apple.com/library/archive/documentation/GraphicsImaging/Reference/CoreImageFilterReference/index.html#//apple_ref/doc/filter/ci/CIGaussianBlur
            // Create grayscale filter
            let filter = CIFilter(name: "CIPhotoEffectMono")
            filter?.setValue(originalImage, forKey: kCIInputImageKey)
            
            let outputImage: CIImage = filter?.outputImage ?? originalImage
            CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
            context.render(outputImage, to: pixelBuffer)
            return RTCVideoFrame.init(buffer: rtcCVPixelBuffer, rotation: frame.rotation, timeStampNs: frame.timeStampNs)
        }
        return frame
    }
}
