//
// Copyright © 2026 Stream.io Inc. All rights reserved.
//

import AVFoundation
import CoreMedia
import Foundation
import WebRTC

/// Audio pipeline owned by `TracksRecorderManager`. Encapsulates the AAC audio path:
///  - the `RecorderAudioRenderTap` installed on
///    `RTCDefaultAudioProcessingModule.renderPreProcessingDelegate`
///    (post-mix decoded audio, no per-track lookup required),
///  - the in-place speaker mute (`muteOriginal: true` on the tap; the tap
///    zero-fills the buffer after copying for recording),
///  - the AAC `AVAssetWriterInput` (writer-driven encode via
///    `outputSettings`),
///  - per-recording counters / PTS range surfaced via `logSummary` at stop.
///
/// All state mutation runs on the host's serial queue. The tap's
/// callback runs on a WebRTC audio thread and re-dispatches onto
/// `host.queue` after copying the PCM buffer.
internal final class AudioPipeline {

    private static let aacBitRate: NSNumber = NSNumber(value: 64_000)

    private weak var host: PipelineHost?

    private let apm: RTCDefaultAudioProcessingModule

    private var renderTap: RecorderAudioRenderTap?
    private var audioInput: AVAssetWriterInput?
    private var inputAdded = false

    // Diagnostic counters + PTS range, surfaced via [logSummary] at stop.
    private var buffersReceived = 0
    private var samplesAppended = 0
    private var buffersDropped = 0
    private var firstSamplePtsUs: Int64 = -1
    private var lastSamplePtsUs: Int64 = -1

    // MARK: - Init

    init(host: PipelineHost, apm: RTCDefaultAudioProcessingModule) {
        self.host = host
        self.apm = apm
    }

    // MARK: - Public API

    /// Install the render-tap as the APM's `renderPreProcessingDelegate`.
    /// The tap copies PCM into a new buffer for recording AND zero-fills the
    /// original (post-mix decoded audio) so the speaker plays silence —
    /// this gives "audio in the file, silence at the speaker" without
    /// disrupting the recording. The standard `track.setVolume(0)` /
    /// `track.isEnabled = false` mutes apply *before* this tap and would
    /// silence the recording too.
    func start() {
        let tap = RecorderAudioRenderTap(muteOriginal: true) { [weak self] pcmBuffer in
            self?.handleAudioBuffer(pcmBuffer: pcmBuffer)
        }
        renderTap = tap
        apm.renderPreProcessingDelegate = tap
    }

    /// On-queue. Clear the render-tap delegate slot — only if it still
    /// points to this pipeline's tap. If another consumer has rotated in,
    /// leave theirs alone.
    func detachSink() {
        if let tap = renderTap, apm.renderPreProcessingDelegate === tap {
            apm.renderPreProcessingDelegate = nil
        }
        renderTap = nil
    }

    /// On-queue. Marks the asset-writer input as finished so the writer can
    /// finalise.
    func markInputAsFinished() {
        audioInput?.markAsFinished()
    }

    func logSummary() {
        let tapCalls = renderTap?.callCount ?? -1
        let durationMs: Int64
        if firstSamplePtsUs >= 0 && lastSamplePtsUs >= firstSamplePtsUs {
            durationMs = (lastSamplePtsUs - firstSamplePtsUs) / 1000
        } else {
            durationMs = -1
        }
        NSLog(
            "[TracksRecorder.Audio] summary received=%d appended=%d dropped=%d tapCalls=%d firstPtsUs=%lld lastPtsUs=%lld durationMs=%lld",
            buffersReceived,
            samplesAppended,
            buffersDropped,
            tapCalls,
            firstSamplePtsUs,
            lastSamplePtsUs,
            durationMs
        )
    }

    // MARK: - Tap → queue bridge

    private func handleAudioBuffer(pcmBuffer: AVAudioPCMBuffer) {
        // Unlike `VideoPipeline`'s `CVPixelBuffer` closure capture, an
        // ARC-retained `AVAudioPCMBuffer` does *not* extend the lifetime
        // of the underlying PCM samples — those live in WebRTC's
        // render-buffer pool and are reused the moment this callback
        // returns. A deep copy before the queue hop is mandatory.
        guard let copy = AudioPipeline.deepCopyPCMBuffer(pcmBuffer) else { return }
        guard let host = host else { return }

        // `DispatchTime.now().uptimeNanoseconds` is the monotonic clock
        // that matches `RTCVideoFrame.timeStampNs` on iOS — both reduce
        // to `mach_absolute_time()` converted to nanoseconds, so the
        // shared time origin works coherently across both pipelines.
        let captureTimeNs = DispatchTime.now().uptimeNanoseconds
        host.queue.async { [weak self] in
            self?.handleAudioBufferOnQueue(pcmBuffer: copy, captureTimeNs: captureTimeNs)
        }
    }

    private func handleAudioBufferOnQueue(pcmBuffer: AVAudioPCMBuffer, captureTimeNs: UInt64) {
        guard let host = host, host.isRecording, let writer = host.assetWriter else { return }

        // Lazy-create the writer's audio input on the first buffer. The
        // input's settings depend on the runtime PCM format reported by
        // WebRTC.
        if audioInput == nil {
            configureAudioInput(format: pcmBuffer.format, writer: writer)
        }

        let pts = presentationTime(host: host, timestampNs: captureTimeNs)

        guard writer.status == .writing,
              let audioInput = audioInput,
              audioInput.isReadyForMoreMediaData else {
            buffersDropped += 1
            return
        }

        guard let sampleBuffer = AudioPipeline.makeSampleBuffer(from: pcmBuffer, pts: pts) else {
            buffersDropped += 1
            return
        }

        if audioInput.append(sampleBuffer) {
            buffersReceived += 1
            samplesAppended += 1
            let ptsUs = Int64(CMTimeGetSeconds(pts) * 1_000_000)
            if firstSamplePtsUs < 0 || ptsUs < firstSamplePtsUs {
                firstSamplePtsUs = ptsUs
            }
            if ptsUs > lastSamplePtsUs {
                lastSamplePtsUs = ptsUs
            }
        } else {
            buffersDropped += 1
        }
    }

    // MARK: - Asset writer input setup

    private func configureAudioInput(format: AVAudioFormat, writer: AVAssetWriter) {
        let settings: [String: Any] = [
            AVFormatIDKey: NSNumber(value: kAudioFormatMPEG4AAC),
            AVSampleRateKey: NSNumber(value: format.sampleRate),
            AVNumberOfChannelsKey: NSNumber(value: format.channelCount),
            AVEncoderBitRateKey: AudioPipeline.aacBitRate,
        ]
        let input = AVAssetWriterInput(mediaType: .audio, outputSettings: settings)
        input.expectsMediaDataInRealTime = true

        guard writer.canAdd(input) else {
            NSLog("[TracksRecorder.Audio] writer cannot add audio input")
            host?.onFatalError(makeRecorderError("audio_input_add_failed", code: 4))
            return
        }
         
        writer.add(input)
        audioInput = input
        inputAdded = true
        host?.onTrackAdded()
    }

    // MARK: - PCM → CMSampleBuffer helper

    /// Converts an `AVAudioPCMBuffer` into a `CMSampleBuffer` suitable for
    /// `AVAssetWriterInput.append`. Returns `nil` if any Core Media call
    /// fails; the caller treats that as a dropped buffer.
    private static func makeSampleBuffer(
        from pcmBuffer: AVAudioPCMBuffer,
        pts: CMTime
    ) -> CMSampleBuffer? {
        var formatDescription: CMAudioFormatDescription?
        let createDescStatus = CMAudioFormatDescriptionCreate(
            allocator: kCFAllocatorDefault,
            asbd: pcmBuffer.format.streamDescription,
            layoutSize: 0,
            layout: nil,
            magicCookieSize: 0,
            magicCookie: nil,
            extensions: nil,
            formatDescriptionOut: &formatDescription
        )
        guard createDescStatus == noErr, let formatDesc = formatDescription else { return nil }

        var sampleBuffer: CMSampleBuffer?
        var timing = CMSampleTimingInfo(
            duration: CMTime(value: 1, timescale: Int32(pcmBuffer.format.sampleRate)),
            presentationTimeStamp: pts,
            decodeTimeStamp: .invalid
        )
        let createStatus = CMSampleBufferCreate(
            allocator: kCFAllocatorDefault,
            dataBuffer: nil,
            dataReady: false,
            makeDataReadyCallback: nil,
            refcon: nil,
            formatDescription: formatDesc,
            sampleCount: CMItemCount(pcmBuffer.frameLength),
            sampleTimingEntryCount: 1,
            sampleTimingArray: &timing,
            sampleSizeEntryCount: 0,
            sampleSizeArray: nil,
            sampleBufferOut: &sampleBuffer
        )
        guard createStatus == noErr, let sb = sampleBuffer else { return nil }

        let setStatus = CMSampleBufferSetDataBufferFromAudioBufferList(
            sb,
            blockBufferAllocator: kCFAllocatorDefault,
            blockBufferMemoryAllocator: kCFAllocatorDefault,
            flags: 0,
            bufferList: pcmBuffer.audioBufferList
        )
        guard setStatus == noErr else { return nil }
        return sb
    }

    /// Returns a deep copy of the supplied `AVAudioPCMBuffer`. WebRTC owns
    /// the source buffer's backing memory only for the duration of the
    /// render-tap callback; ARC retains the wrapper across the queue hop
    /// but not the underlying PCM samples. Copying here lets the recorder
    /// queue read the data later without racing WebRTC's render-buffer
    /// reuse.
    private static func deepCopyPCMBuffer(_ source: AVAudioPCMBuffer) -> AVAudioPCMBuffer? {
        guard let copy = AVAudioPCMBuffer(
            pcmFormat: source.format,
            frameCapacity: source.frameCapacity
        ) else { return nil }
        copy.frameLength = source.frameLength
        let frameLength = Int(source.frameLength)
        let channelCount = Int(source.format.channelCount)
        if let src = source.int16ChannelData, let dst = copy.int16ChannelData {
            for ch in 0..<channelCount {
                memcpy(dst[ch], src[ch], frameLength * MemoryLayout<Int16>.size)
            }
        } else if let src = source.floatChannelData, let dst = copy.floatChannelData {
            for ch in 0..<channelCount {
                memcpy(dst[ch], src[ch], frameLength * MemoryLayout<Float>.size)
            }
        } else if let src = source.int32ChannelData, let dst = copy.int32ChannelData {
            for ch in 0..<channelCount {
                memcpy(dst[ch], src[ch], frameLength * MemoryLayout<Int32>.size)
            }
        }
        return copy
    }
}
