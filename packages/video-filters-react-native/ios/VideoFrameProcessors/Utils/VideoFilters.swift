//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import CoreImage
import Foundation

extension RTCVideoRotation {
    /// Maps the capture pipeline's frame rotation to the image orientation used when orienting
    /// the background image. Using the frame's own rotation metadata keeps the background in sync
    /// with the outgoing video even when the app UI is orientation-locked or mid-rotation, unlike
    /// reading the UI's interface orientation.
    var cgOrientation: CGImagePropertyOrientation {
        switch self {
        case ._0:
            return .up
        case ._90:
            return .left
        case ._180:
            return .down
        case ._270:
            return .right
        @unknown default:
            return .up
        }
    }
}

open class VideoFilter: NSObject, VideoFrameProcessorDelegate {

    /// An object which encapsulates the required input for a Video filter.
    public struct Input {
        /// The image (video frame) that the filter should be applied on.
        public var originalImage: CIImage

        /// The pixelBuffer that produces the image (video frame) that the filter should be applied on.
        public var originalPixelBuffer: CVPixelBuffer

        /// The orientation on which the image (video frame) was generated from.
        public var originalImageOrientation: CGImagePropertyOrientation
    }
    /// Filter closure that takes a CIImage as input and returns a filtered CIImage as output.
    public var filter: (Input) -> CIImage
    
    private let context: CIContext

    /// Initializes a new VideoFilter instance with the provided parameters.
    public init(
        filter: @escaping (Input) -> CIImage
    ) {
        self.filter = filter
        self.context = CIContext(options: [CIContextOption.useSoftwareRenderer: false])
        super.init()
    }

    public func capturer(_ capturer: RTCVideoCapturer!, didCapture frame: RTCVideoFrame!) -> RTCVideoFrame! {
        if let rtcCVPixelBuffer = frame.buffer as? RTCCVPixelBuffer {
            let pixelBuffer = rtcCVPixelBuffer.pixelBuffer
            
            CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
            let outputImage: CIImage = self.filter(
                Input(
                    originalImage: CIImage(cvPixelBuffer: pixelBuffer),
                    originalPixelBuffer: pixelBuffer,
                    originalImageOrientation: frame.rotation.cgOrientation
                )
            )
            CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
            context.render(outputImage, to: pixelBuffer)
            return RTCVideoFrame.init(buffer: rtcCVPixelBuffer, rotation: frame.rotation, timeStampNs: frame.timeStampNs)
        }
        return frame
    }
}
