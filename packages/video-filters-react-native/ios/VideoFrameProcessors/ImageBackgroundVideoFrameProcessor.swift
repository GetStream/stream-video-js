//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import CoreImage
import Foundation

/// A video filter that applies a custom image as the background.
///
/// This filter uses a provided image taken from `backgroundImageUrl` as the background and combines it with
/// the foreground objects using a filter processor. It caches processed background images to optimize
/// performance for matching input sizes and orientations.
@available(iOS 15.0, *)
final class ImageBackgroundVideoFrameProcessor: VideoFilter {
    
    private struct CacheValue: Hashable {
        var originalImageSize: CGSize
        var originalImageOrientation: CGImagePropertyOrientation
        var result: CIImage

        func hash(into hasher: inout Hasher) {
            hasher.combine(originalImageSize.width)
            hasher.combine(originalImageSize.height)
            hasher.combine(originalImageOrientation)
        }
    }

    private var cachedValue: CacheValue?
    private var backgroundImageUrl: String

    private lazy var backgroundImageFilterProcessor = { return BackgroundImageFilterProcessor() }()

    // Background-loaded off the capture thread; `Data(contentsOf:)` on a remote URL
    // would otherwise block the first frame(s) for the full network fetch duration.
    // Guarded by an NSLock because Swift's `lazy var` is not thread-safe for class
    // instances and the property is written from a background queue but read from
    // the WebRTC capture thread.
    private let backgroundImageLock = NSLock()
    private var _backgroundCIImage: CIImage?

    private var backgroundCIImage: CIImage? {
        backgroundImageLock.lock()
        defer { backgroundImageLock.unlock() }
        return _backgroundCIImage
    }

    @available(*, unavailable)
    override public init(
        filter: @escaping (Input) -> CIImage
    ) { fatalError() }

    init(_ backgroundImageUrl: String) {
        self.backgroundImageUrl = backgroundImageUrl
        super.init(
            filter: { input in input.originalImage }
        )

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.loadBackgroundImage()
        }

        self.filter = { [weak self] input in
            // `self.filter` is stored on `self`; capture weakly to avoid a retain cycle
            // that would otherwise leak the processor for the lifetime of the app.
            guard let self = self, let bgImage = self.backgroundCIImage else { return input.originalImage }
            let cachedBackgroundImage = self.backgroundImage(image: bgImage, originalImage: input.originalImage, originalImageOrientation: input.originalImageOrientation)

            let outputImage: CIImage = self.backgroundImageFilterProcessor
                .applyFilter(
                    input.originalPixelBuffer,
                    backgroundImage: cachedBackgroundImage
                ) ?? input.originalImage

            return outputImage
        }
    }

    private func loadBackgroundImage() {
        var bgUIImage: UIImage?
        if let url = URL(string: backgroundImageUrl) {
            bgUIImage = RCTImageFromLocalAssetURL(url)
            if bgUIImage == nil {
                if let data = try? Data(contentsOf: url) {
                    bgUIImage = UIImage(data: data)
                } else {
                    NSLog("Failed to convert uri to image: -\(backgroundImageUrl)")
                }
            }
        }
        guard let bgUIImage = bgUIImage else { return }
        backgroundImageLock.lock()
        _backgroundCIImage = CIImage(image: bgUIImage)
        backgroundImageLock.unlock()
    }
    
    /// Returns the cached or processed background image for a given original image (frame image).
    private func backgroundImage(image: CIImage, originalImage: CIImage, originalImageOrientation: CGImagePropertyOrientation) -> CIImage {
        if
            let cachedValue = cachedValue,
            cachedValue.originalImageSize == originalImage.extent.size,
            cachedValue.originalImageOrientation == originalImageOrientation {
            return cachedValue.result
        } else {
            var cachedBackgroundImage = image.oriented(originalImageOrientation)

            if cachedBackgroundImage.extent.size != originalImage.extent.size {
                cachedBackgroundImage = cachedBackgroundImage
                    .resize(originalImage.extent.size) ?? cachedBackgroundImage
            }

            cachedValue = .init(
                originalImageSize: originalImage.extent.size,
                originalImageOrientation: originalImageOrientation,
                result: cachedBackgroundImage
            )
            return cachedBackgroundImage
        }
    }
}
