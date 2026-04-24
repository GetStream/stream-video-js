//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import CoreImage
import CoreImage.CIFilterBuiltins
import Foundation
import Vision

/// Processes a video frame to create a new image with a custom background.
///
/// This class generates a person segmentation mask using Vision, scales the mask
/// to match the video frame size, and blends the original image with a provided
/// background image using the mask. This allows for effects like background
/// replacement or blurring.
@available(iOS 15.0, *)
final class BackgroundImageFilterProcessor {
    private static let segmentationTargetHeight: CGFloat = 540

    private let requestHandler = VNSequenceRequestHandler()
    private let request: VNGeneratePersonSegmentationRequest


    /// Initializes a new `BackgroundImageFilterProcessor` instance.
    ///
    /// - Parameters:
    ///   - qualityLevel: The quality level for segmentation, defaults to
    ///     `.balanced` if a neural engine is available, otherwise `.fast` for
    ///     performance.
    init(
        _ qualityLevel: VNGeneratePersonSegmentationRequest.QualityLevel = neuralEngineExists ? .balanced : .fast
    ) {
        let request = VNGeneratePersonSegmentationRequest()
        request.qualityLevel = qualityLevel
        request.outputPixelFormat = kCVPixelFormatType_OneComponent8
        self.request = request
    }

    /// Applies the filter to a video frame using a background image.
    ///
    /// - Parameters:
    ///   - buffer: The video frame to process as a `CVPixelBuffer`.
    ///   - backgroundImage: The background image to blend with the foreground.
    /// - Returns: A new `CIImage` with the processed frame, or `nil` if an error occurs.
    func applyFilter(
        _ buffer: CVPixelBuffer,
        backgroundImage: CIImage
    ) -> CIImage? {
        do {
            let originalImage = CIImage(cvPixelBuffer: buffer)

            // Run segmentation at ~540p — Vision's cost scales with input size.
            // The mask-upscale step below already handles whatever size Vision returns.
            let segInput: CIImage
            if originalImage.extent.height > Self.segmentationTargetHeight {
                let scale = Self.segmentationTargetHeight / originalImage.extent.height
                let targetSize = CGSize(
                    width: originalImage.extent.width * scale,
                    height: Self.segmentationTargetHeight
                )
                segInput = originalImage.resize(targetSize) ?? originalImage
            } else {
                segInput = originalImage
            }

            try requestHandler.perform([request], on: segInput, orientation: .up)

            if let maskPixelBuffer = request.results?.first?.pixelBuffer {
                var maskImage = CIImage(cvPixelBuffer: maskPixelBuffer)

                // Scale the mask image to fit the bounds of the video frame.
                let scaleX = originalImage.extent.width / maskImage.extent.width
                let scaleY = originalImage.extent.height / maskImage.extent.height
                maskImage = maskImage.transformed(by: .init(scaleX: scaleX, y: scaleY))

                // Blend the original, background, and mask images.
                let blendFilter = CIFilter.blendWithMask()
                blendFilter.inputImage = originalImage
                blendFilter.backgroundImage = backgroundImage
                blendFilter.maskImage = maskImage

                let result = blendFilter.outputImage
                return result
            } else {
                return nil
            }
        } catch {
            return nil
        }
    }
}
