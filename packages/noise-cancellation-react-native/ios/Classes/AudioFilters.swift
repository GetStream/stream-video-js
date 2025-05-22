//
// Copyright © 2024 Stream.io Inc. All rights reserved.

//

import Foundation
import stream_react_native_webrtc

/// AudioFilter protocol defines the structure for audio filtering implementations.
public protocol AudioFilter: Sendable {
    /// Unique identifier for the audio filter.
    var id: String { get }

    /// Initializes the audio filter with specified sample rate and number of channels.
    func initialize(sampleRate: Int, channels: Int)

    /// Applies the defined audio effect to the given audio buffer.
    func applyEffect(to audioBuffer: inout RTCAudioBuffer)

    /// Releases resources associated with the audio filter.
    func release()
}
