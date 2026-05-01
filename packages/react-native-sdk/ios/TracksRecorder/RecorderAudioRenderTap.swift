//
// Copyright © 2026 Stream.io Inc. All rights reserved.
//

import AVFoundation
import CoreMedia
import Foundation
import WebRTC

/// Render-side audio tap used by `TracksRecorderManager`. Implements
/// `RTCAudioCustomProcessingDelegate` and is installed on
/// `RTCDefaultAudioProcessingModule.renderPreProcessingDelegate` for the
/// duration of a recording.
///
/// The render path WebRTC is using:
/// ```
/// SFU → decoder → audio mixer → renderPreProcessingDelegate (us) →
///   render-side processing → speaker
/// ```
///
/// What the delegate sees per call: an `RTCAudioBuffer` that holds the
/// **post-mix** decoded audio about to be played to the speaker. In a
/// self-sub-only call, that's exactly the SFU echo of the local mic. In a
/// call with multiple remote participants the buffer would contain the
/// post-mix output (everyone blended together) — v1 does not target that
/// scenario.
///
/// **Important:** `RTCAudioBuffer` exposes `rawBuffer(forChannel:)` as
/// `UnsafeMutablePointer<Float>` in **FloatS16** format — i.e. Float32 values
/// in the Int16 range -32768…32767. Cast/clamp to `Int16` for our PCM buffer
/// (no normalisation needed). See the same memo on `ScreenShareAudioMixer`.
///
/// **Threading:** all three protocol methods run on a WebRTC audio
/// processing thread. The buffer handler closure is invoked from there; the
/// caller is responsible for hopping queues if needed.
///
/// **Lifetime:** `RTCDefaultAudioProcessingModule.renderPreProcessingDelegate`
/// is `weak`, so the manager must keep this instance alive for the duration
/// of recording.
@objc public final class RecorderAudioRenderTap: NSObject, RTCAudioCustomProcessingDelegate {

    typealias BufferHandler = (AVAudioPCMBuffer) -> Void

    private let bufferHandler: BufferHandler

    /// When `true`, the WebRTC `RTCAudioBuffer` is zero-filled in place
    /// *after* we've copied it into our recording PCM buffer. The recorder
    /// keeps the original audio; everything downstream of this delegate
    /// (render-side APM → audio device module → speaker) sees silence.
    /// This is how we get "audio in the file, silence at the speaker"
    /// without disrupting the recording — the standard `track.setVolume(0)`
    /// / `track.isEnabled = false` mutes apply *before* our tap and would
    /// silence the recording too.
    ///
    /// Side effect to be aware of: this mutes the entire post-mix
    /// playback, not just one track. In a self-sub-only call (v1's pre-
    /// call test scenario) post-mix == loopback, so it's effectively a
    /// per-track mute. With other remote participants in the call they'd
    /// be muted at the speaker too while recording is active.
    private let muteOriginal: Bool

    private var processingSampleRate: Double = 0
    private var processingChannels: Int = 0
    private var avFormat: AVAudioFormat?

    /// Atomic-style call counter — exposes whether the APM is invoking
    /// `audioProcessingProcess(audioBuffer:)` at all.
    private let counterLock = NSLock()
    private var _callCount: Int = 0
    @objc public var callCount: Int {
        counterLock.lock()
        defer { counterLock.unlock() }
        return _callCount
    }

    init(muteOriginal: Bool, bufferHandler: @escaping BufferHandler) {
        self.muteOriginal = muteOriginal
        self.bufferHandler = bufferHandler
        super.init()
    }

    // MARK: - RTCAudioCustomProcessingDelegate

    public func audioProcessingInitialize(sampleRate: Int, channels: Int) {
        processingSampleRate = Double(sampleRate)
        processingChannels = channels
        avFormat = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: processingSampleRate,
            channels: AVAudioChannelCount(channels),
            interleaved: false
        )
        NSLog("[TracksRecorder] RenderTap initialize sampleRate=%d channels=%d",
              sampleRate, channels)
    }

    public func audioProcessingProcess(audioBuffer: RTCAudioBuffer) {
        counterLock.lock()
        _callCount += 1
        let count = _callCount
        counterLock.unlock()

        if count == 1 {
            NSLog("[TracksRecorder] RenderTap FIRST call frames=%d channels=%d",
                  audioBuffer.frames, audioBuffer.channels)
        } else if count % 100 == 0 {
            NSLog("[TracksRecorder] RenderTap call #%d", count)
        }

        guard let format = avFormat else { return }
        let frames = Int(audioBuffer.frames)
        let channels = Int(audioBuffer.channels)
        guard frames > 0, channels > 0 else { return }

        guard let pcm = AVAudioPCMBuffer(
            pcmFormat: format,
            frameCapacity: AVAudioFrameCount(frames)
        ) else {
            return
        }
        pcm.frameLength = AVAudioFrameCount(frames)
        guard let dst = pcm.int16ChannelData else { return }

        // Copy each channel: FloatS16 (Float32 in Int16 range) → Int16.
        // No normalisation needed — values already span the Int16 range.
        // If `muteOriginal` is on, zero the source buffer in the same pass
        // so the data continuing downstream to the speaker is silence.
        for ch in 0..<channels {
            let src = audioBuffer.rawBuffer(forChannel: ch)
            let dstChannel = dst[ch]
            for i in 0..<frames {
                let v = src[i]
                if v >= 32767 {
                    dstChannel[i] = Int16.max
                } else if v <= -32768 {
                    dstChannel[i] = Int16.min
                } else {
                    dstChannel[i] = Int16(v)
                }
                if muteOriginal {
                    src[i] = 0
                }
            }
        }

        bufferHandler(pcm)
    }

    public func audioProcessingRelease() {
        avFormat = nil
        // Deliberately preserve `_callCount` — useful in end-of-recording
        // diagnostics even after release.
    }
}
