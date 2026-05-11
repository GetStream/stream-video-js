//
// Copyright © 2026 Stream.io Inc. All rights reserved.
//

import AVFoundation
import Foundation

/// Internal coordination contract between `TracksRecorderManager` and its
/// per-kind pipelines (`VideoPipeline`, `AudioPipeline`). The pipelines own
/// their encoder + sink + drain logic; the host owns lifecycle, the asset
/// writer, the writer-start gate, the shared time origin, and the terminal-
/// completion barrier.
///
/// Every method on this protocol is called from the host's serial queue —
/// pipelines must `host.queue.async { ... }` before calling back into the
/// host. The protocol is class-bound so pipelines can hold a `weak`
/// reference and avoid retain cycles.
internal protocol PipelineHost: AnyObject {
    /// The recorder's serial dispatch queue.
    var queue: DispatchQueue { get }

    var assetWriter: AVAssetWriter? { get }

    var isRecording: Bool { get }

    /// Returns the recording's shared time origin in nanoseconds. The first
    /// pipeline to deliver a sample seeds the origin with its timestamp;
    /// subsequent calls return the established value.
    func seedOriginNs(_ timestampNs: UInt64) -> UInt64

    /// Pipeline has added an input to the writer. The host decrements its
    /// pending-pipeline counter and starts the writer once all expected
    /// pipelines have reported their input.
    func onTrackAdded()

    func onFatalError(_ error: NSError)
}

internal func makeRecorderError(_ message: String, code: Int) -> NSError {
    NSError(
        domain: "io.stream.video.tracks-recorder",
        code: code,
        userInfo: [NSLocalizedDescriptionKey: message]
    )
}
