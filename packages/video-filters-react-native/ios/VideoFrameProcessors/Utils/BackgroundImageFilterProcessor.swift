//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import CoreImage
import CoreImage.CIFilterBuiltins
import Foundation
import Vision

/// Blends a video frame with a custom background using a Vision-generated mask.
///
/// Segmentation runs asynchronously: each `applyFilter` call composites with the last
/// completed mask and only kicks a new Vision request if one isn't already in flight.
/// This keeps the capture thread unblocked at the cost of ≤1–2 frames of mask staleness,
/// which is imperceptible in practice (Android uses the same pattern with ML Kit).
@available(iOS 15.0, *)
final class BackgroundImageFilterProcessor {
    private static let segmentationTargetHeight: CGFloat = 540

    private let requestHandler = VNSequenceRequestHandler()
    private let request: VNGeneratePersonSegmentationRequest

    // Async segmentation pipeline. `ciContext` snapshots `CIImage`s to `CGImage`s so
    // Vision doesn't share storage with the camera buffer pool or its own pooled result
    // buffers. `segQueue` serialises Vision calls — `VNSequenceRequestHandler` isn't
    // thread-safe under concurrent use. `segLock` guards `lastMask` and `inFlight`,
    // both shared between the capture thread and `segQueue`.
    private let ciContext = CIContext(options: [.useSoftwareRenderer: false])
    private let segQueue = DispatchQueue(label: "io.getstream.video.segmentation", qos: .userInitiated)
    private let segLock = NSLock()
    private var lastMask: CIImage?
    private var inFlight = false


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
    /// - Returns: The blended `CIImage`. If no mask is ready yet (typical for the first
    ///   1–2 frames of a session), returns `originalImage` as a pass-through. Returns
    ///   `nil` if the blend filter itself fails.
    func applyFilter(
        _ buffer: CVPixelBuffer,
        backgroundImage: CIImage
    ) -> CIImage? {
        let originalImage = CIImage(cvPixelBuffer: buffer)

        segLock.lock()
        let mask = lastMask
        let shouldDispatch = !inFlight
        if shouldDispatch {
            inFlight = true
        }
        segLock.unlock()

        if shouldDispatch {
            let segInput = downscaleForSeg(originalImage)
            // detach from the camera pool — `VideoFilter` will write the composite back into `buffer`
            if let segCG = ciContext.createCGImage(segInput, from: segInput.extent) {
                segQueue.async { [weak self] in
                    self?.runSegmentation(on: segCG)
                }
            } else {
                segLock.lock()
                inFlight = false
                segLock.unlock()
            }
        }

        guard var maskImage = mask else {
            return originalImage
        }

        // Scale the mask image to fit the bounds of the video frame.
        let scaleX = originalImage.extent.width / maskImage.extent.width
        let scaleY = originalImage.extent.height / maskImage.extent.height
        maskImage = maskImage.transformed(by: .init(scaleX: scaleX, y: scaleY))

        // Blend the original, background, and mask images.
        let blendFilter = CIFilter.blendWithMask()
        blendFilter.inputImage = originalImage
        blendFilter.backgroundImage = backgroundImage
        blendFilter.maskImage = maskImage

        return blendFilter.outputImage
    }

    private func downscaleForSeg(_ image: CIImage) -> CIImage {
        // Run segmentation at ~540p — Vision's cost scales with input size.
        // The mask-upscale step below already handles whatever size Vision returns.
        if image.extent.height > Self.segmentationTargetHeight {
            let scale = Self.segmentationTargetHeight / image.extent.height
            let targetSize = CGSize(
                width: image.extent.width * scale,
                height: Self.segmentationTargetHeight
            )
            return image.resize(targetSize) ?? image
        }
        return image
    }

    /// Runs on `segQueue`. Performs Vision on the snapshotted `CGImage` and stores the
    /// result mask under `segLock`. `inFlight` is always cleared via `defer`, so a thrown
    /// `perform`, missing results, or failed snapshot won't deadlock future frames.
    private func runSegmentation(on cgImage: CGImage) {
        defer {
            segLock.lock()
            inFlight = false
            segLock.unlock()
        }
        do {
            try requestHandler.perform([request], on: cgImage, orientation: .up)
            guard let maskPixelBuffer = request.results?.first?.pixelBuffer else {
                return
            }
            let rawMask = CIImage(cvPixelBuffer: maskPixelBuffer)
            // Snapshot to a CGImage so `lastMask` survives Vision's potential buffer reuse.
            guard let maskCG = ciContext.createCGImage(rawMask, from: rawMask.extent) else {
                return
            }
            let snapshot = CIImage(cgImage: maskCG)
            segLock.lock()
            lastMask = snapshot
            segLock.unlock()
        } catch {
            return
        }
    }
}
