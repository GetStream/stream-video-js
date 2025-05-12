//

// Copyright © 2024 Stream.io Inc. All rights reserved.
//

import Foundation
import Combine
import stream_react_native_webrtc
import os.log

/// A concrete implementation of `AudioFilter` that applies noise cancellation effects.
public final class NoiseCancellationFilter: AudioFilter, @unchecked Sendable {

    public typealias InitializeClosure = (Int, Int) -> Void
    public typealias ProcessClosure = (Int, Int, Int, UnsafeMutablePointer<Float>) -> Void
    public typealias ReleaseClosure = () -> Void

    private var isActive: Bool = false
    private let serialQueue = SerialActorQueue()

    private let name: String
    private let initializeClosure: (Int, Int) -> Void
    private let processClosure: (Int, Int, Int, UnsafeMutablePointer<Float>) -> Void
    private let releaseClosure: () -> Void

    private let logger = OSLog(subsystem: "io.stream.noise-cancellation", category: "NoiseCancellationFilter")

    /// Initializes a new instance of `NoiseCancellationFilter`.
    /// - Parameters:
    ///   - name: The name identifier for the filter.
    ///   - initialize: The closure to initialize the filter with sample rate and channels.
    ///   - process: The closure to apply noise cancellation processing.
    ///   - release: The closure to release the filter.
    public init(
        name: String,
        initialize: @escaping InitializeClosure,
        process: @escaping ProcessClosure,
        release: @escaping ReleaseClosure
    ) {
        os_log("Initializing NoiseCancellationFilter with name: %{public}@", log: logger, type: .debug, name)
        self.name = name
        initializeClosure = initialize
        processClosure = process
        releaseClosure = release
    }

    // MARK: - AudioFilter

    /// The identifier of the filter.
    public var id: String { name }

    /// Initializes the filter with the specified sample rate and number of channels.
    /// - Parameters:
    ///   - sampleRate: The sample rate in Hz.
    ///   - channels: The number of audio channels.
    public func initialize(sampleRate: Int, channels: Int) {
        serialQueue.async { [weak self] in
            guard let self, !isActive else { return }
            os_log("Initializing filter with sampleRate: %{public}d, channels: %{public}d", log: logger, type: .debug, sampleRate, channels)
            self.initializeClosure(sampleRate, channels)
            self.isActive = true
            os_log("Filter initialized and activated", log: logger, type: .debug)
        }

    }

    /// Applies noise cancellation processing to the audio buffer.
    /// - Parameter buffer: The audio buffer to which the effect is applied.
    public func applyEffect(to buffer: inout RTCAudioBuffer) {
        guard isActive else {
//            os_log("Skipping effect application - filter not active", log: logger, type: .debug)
            return
        }
        
        os_log("Applying effect to buffer with channels: %{public}d, bands: %{public}d, frames: %{public}d", 
               log: logger, type: .debug, buffer.channels, buffer.bands, buffer.frames)
        processClosure(
            buffer.channels,
            buffer.bands,
            buffer.frames,
            buffer.rawBuffer(forChannel: 0)
        )
        os_log("Effect applied to buffer", log: logger, type: .debug)
    }

    /// Releases the filter by stopping noise cancellation for the active call.
    public func release() {
        serialQueue.async { [weak self] in
            guard let self else { return }
            isActive = false
            os_log("Releasing filter", log: logger, type: .debug)
            releaseClosure()  // Invoke the release closure.
            os_log("Filter released", log: logger, type: .debug)
        }
    }
}
