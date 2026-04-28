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

    // Loaded on a background queue so a slow URL doesn't block the capture thread.
    // NSLock because the load thread writes it and the capture thread reads it.
    private let backgroundImageLock = NSLock()
    private var _backgroundCIImage: CIImage?
    private var backgroundImageTask: URLSessionDataTask?

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
            // `[weak self]`: the closure is stored on `self` — a strong capture would leak the processor.
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
        guard let url = URL(string: backgroundImageUrl) else { return }
        if let bgUIImage = RCTImageFromLocalAssetURL(url) {
            setBackgroundImage(bgUIImage)
            return
        }
        // Bounded timeout (matches Android's 10s) so a hanging remote URL
        // doesn't keep this processor alive for the OS-default ~75s.
        var request = URLRequest(url: url)
        request.timeoutInterval = 10
        let task = URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            // `[weak self]`: if the processor is released while the task is in flight
            // (deinit calls cancel()), the closure no-ops and the task is freed.
            guard let self = self else { return }
            guard let data = data, let bgUIImage = UIImage(data: data) else {
                // URLs may carry signed-access query tokens; log only the host.
                let host = url.host ?? "local"
                NSLog("Failed to load virtual-background image (host=\(host))")
                return
            }
            self.setBackgroundImage(bgUIImage)
        }
        backgroundImageTask = task
        task.resume()
    }

    private func setBackgroundImage(_ image: UIImage) {
        backgroundImageLock.lock()
        _backgroundCIImage = CIImage(image: image)
        backgroundImageLock.unlock()
    }

    deinit {
        backgroundImageTask?.cancel()
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
