//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

#if canImport(UIKit)
import Foundation
import UIKit

extension UIInterfaceOrientation {
    /// Values of `CGImagePropertyOrientation` define the position of the pixel coordinate origin
    /// point (0,0) and the directions of the coordinate axes relative to the intended display orientation of
    /// the image. While `UIInterfaceOrientation` uses a different point as its (0,0), this extension
    /// provides a simple way of mapping device orientation to image orientation.
    var cgOrientation: CGImagePropertyOrientation {
        switch self {
        /// Handle known portrait orientations
        case .portrait:
            return .left

        case .portraitUpsideDown:
            return .right

        /// Handle known landscape orientations
        case .landscapeLeft:
            return .up

        case .landscapeRight:
            return .down

        /// Unknown case, return `up` for consistency
        case .unknown:
            return .up

        /// Default case for unknown orientations or future additions
        /// Returns `up` for consistency.
        @unknown default:
            return .up
        }
    }
}

#endif // #if canImport(UIKit)

import Foundation

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
    
    var sceneOrientation: UIInterfaceOrientation = .unknown

    /// Initializes a new VideoFilter instance with the provided parameters.
    public init(
        filter: @escaping (Input) -> CIImage
    ) {
        self.filter = filter
        self.context = CIContext(options: [CIContextOption.useSoftwareRenderer: false])
        super.init()
        // listen to when the device's orientation changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(updateRotation),
            name: UIDevice.orientationDidChangeNotification,
            object: nil
        )
        updateRotation()
    }
    
    @objc private func updateRotation() {
        DispatchQueue.main.async {
            self.sceneOrientation = UIApplication.shared.windows.first?.windowScene?.interfaceOrientation ?? .unknown
        }
    }
    
    public func capturer(_ capturer: RTCVideoCapturer!, didCapture frame: RTCVideoFrame!) -> RTCVideoFrame! {
        if let rtcCVPixelBuffer = frame.buffer as? RTCCVPixelBuffer {
            let pixelBuffer = rtcCVPixelBuffer.pixelBuffer
            
            CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
            let outputImage: CIImage = self.filter(
                Input(
                    originalImage: CIImage(cvPixelBuffer: pixelBuffer),
                    originalPixelBuffer: pixelBuffer,
                    originalImageOrientation: self.sceneOrientation.cgOrientation
                )
            )
            CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
            context.render(outputImage, to: pixelBuffer)
            return RTCVideoFrame.init(buffer: rtcCVPixelBuffer, rotation: frame.rotation, timeStampNs: frame.timeStampNs)
        }
        return frame
    }
}
