//
// Copyright © 2026 Stream.io Inc. All rights reserved.
//

import AVFoundation
import CoreMedia
import CoreVideo
import Foundation
import VideoToolbox
import WebRTC

/// Owns the `AVAssetWriter`, both inputs, the per-track sinks, and a
/// `VTCompressionSession` for video. Generic orchestrator — knows nothing
/// about loopback or any specific use case. The public surface is wrapped by
/// `StreamVideoReactNative.m`'s `startTrackRecording` / `stopTrackRecording`
/// RCT methods, which in turn are the bridge contract used by the JS
/// `useLoopbackRecording` hook.
///
/// **Why `VTCompressionSession` + passthrough writer?** Running
/// `AVAssetWriter` against a hardware H.264 encoder while WebRTC's publisher
/// is *also* using one fails on iOS with `AVErrorOperationInterrupted`
/// (-11847) — there's only one hardware H.264 session available and the
/// publisher wins preemption. We sidestep this by driving a
/// `VTCompressionSession` ourselves with the software-encoder hint
/// (`kVTVideoEncoderSpecification_EnableHardwareAcceleratedVideoEncoder =
/// false`), then feeding the resulting encoded `CMSampleBuffer`s into an
/// `AVAssetWriterInput` configured with `outputSettings: nil` — passthrough
/// mode, which only muxes (no re-encoding). The publisher keeps the hardware
/// encoder; we encode in software in parallel.
///
/// **Completion semantics.** The `startRecording` completion is the
/// *lifecycle* signal — it fires once at the terminal moment of the recording
/// (auto-stop timer expired, manual stop, or fatal error), carrying the
/// resulting file URL or an error. The `stopRecording` completion is just a
/// synchronization point — `void` — so callers can `await
/// stopTrackRecording(); await getStreamRecordings()` without racing the
/// disk flush. The URL flows back through the start promise on every
/// termination path; manual stop does not expose its own URL.
@objc public final class TracksRecorderManager: NSObject {

    @objc public static let shared = TracksRecorderManager()

    // MARK: - Configuration

    /// Container directory for all recordings produced through this manager.
    /// Used by `clearRecordingsDirectory` and `listRecordings` as the cleanup
    /// boundary — individual filenames are deliberately not tracked.
    @objc public var recordingsDirectory: URL {
        let tmp = NSTemporaryDirectory()
        let url = URL(fileURLWithPath: tmp).appendingPathComponent("StreamRecordings", isDirectory: true)
        try? FileManager.default.createDirectory(
            at: url,
            withIntermediateDirectories: true,
            attributes: nil
        )
        return url
    }

    // MARK: - State

    private let queue = DispatchQueue(label: "io.stream.video.tracks-recorder")

    private var assetWriter: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var audioInput: AVAssetWriterInput?
    private var compressionSession: VTCompressionSession?

    private var videoSink: RecorderVideoSink?
    /// Render-side audio tap installed on
    /// `RTCDefaultAudioProcessingModule.renderPreProcessingDelegate`.
    /// The APM delegate slot is `weak`, so the manager has to retain this
    /// instance for the duration of the recording.
    private var audioRenderTap: RecorderAudioRenderTap?
    /// Strong reference — holds the `RTCVideoTrack` wrapper for the
    /// duration of the recording. `RTCRtpReceiver.track` creates a fresh
    /// wrapper on every call and the wrapper's `dealloc` unregisters all
    /// of its sinks from the native C++ track. Explicitly nil-ed in
    /// `cleanupAfterStop` so there is no retain-cycle risk.
    private var videoTrack: RTCVideoTrack?
    /// Reference to the APM that owns our render-tap delegate slot, so
    /// `stopRecording` can clear the slot. Identity-checked before
    /// clearing to avoid stomping on a different consumer's tap.
    private var audioProcessingModule: RTCDefaultAudioProcessingModule?

    private var outputURL: URL?
    /// Fired once at the recording's terminal moment with the produced file
    /// URL (or nil) and any fatal error.
    private var startCompletion: ((URL?, NSError?) -> Void)?
    private var terminalBarrierFired = false

    private var isRecording = false
    private var pendingVideo = false
    private var pendingAudio = false
    private var recordingStartHostTimeNs: UInt64?
    private var autoStopTimer: DispatchSourceTimer?

    private var videoFramesEncoded = 0
    private var videoSamplesAppended = 0
    private var videoFrameAppendFailures = 0
    private var videoFramesDropped = 0

    private static let timebaseInfo: mach_timebase_info_data_t = {
        var info = mach_timebase_info_data_t()
        mach_timebase_info(&info)
        return info
    }()

    private static func currentHostTimeNs() -> UInt64 {
        let absTime = mach_absolute_time()
        let info = timebaseInfo
        return absTime * UInt64(info.numer) / UInt64(info.denom)
    }

    // MARK: - Public API

    @objc public func startRecording(
        videoTrackId: String?,
        audioTrackId: String?,
        maxDurationMs: Int,
        muteLoopbackPlayback: Bool,
        webRTCModule: WebRTCModule,
        completion: @escaping (URL?, NSError?) -> Void
    ) {
        queue.async { [weak self] in
            guard let self = self else { return }

            if self.isRecording {
                completion(nil, Self.error("recording_in_progress", code: 1))
                return
            }

            let videoTrack = videoTrackId
                .flatMap { webRTCModule.track(forId: $0) } as? RTCVideoTrack
            // Audio: we don't look up a specific track — instead we install
            // a render-side APM tap that observes the post-mix decoded
            // audio. `audioTrackId` being non-nil is just a request
            // signal; the actual track instance is irrelevant on iOS.
            let audioRequested = (audioTrackId != nil)

            if videoTrack == nil && !audioRequested {
                completion(nil, Self.error("no_tracks_resolved", code: 2))
                return
            }

            // Resolve the APM for the render-side audio tap before we open
            // any files — so a missing/incompatible APM fails fast.
            var apm: RTCDefaultAudioProcessingModule?
            if audioRequested {
                let apmId = WebRTCModuleOptions.sharedInstance().audioProcessingModule
                guard let resolved = apmId as? RTCDefaultAudioProcessingModule else {
                    completion(nil, Self.error("audio_processing_module_unavailable", code: 5))
                    return
                }
                if resolved.renderPreProcessingDelegate != nil {
                    completion(nil, Self.error("recording_blocked_by_audio_render_tap", code: 6))
                    return
                }
                apm = resolved
            }

            let dir = self.recordingsDirectory
            let timestamp = Int(Date().timeIntervalSince1970 * 1000)
            let outputURL = dir.appendingPathComponent("recording_\(timestamp).mp4")

            let writer: AVAssetWriter
            do {
                writer = try AVAssetWriter(url: outputURL, fileType: .mp4)
            } catch {
                completion(nil, error as NSError)
                return
            }

            self.assetWriter = writer
            self.outputURL = outputURL
            self.videoTrack = videoTrack
            self.audioProcessingModule = apm
            self.startCompletion = completion
            self.terminalBarrierFired = false
            self.recordingStartHostTimeNs = nil
            self.pendingVideo = (videoTrack != nil)
            self.pendingAudio = audioRequested
            self.isRecording = true

            if let videoTrack = videoTrack {
                let sink = RecorderVideoSink { [weak self] pixelBuffer, width, height, timestampNs in
                    self?.handleVideoFrame(
                        pixelBuffer: pixelBuffer,
                        width: width,
                        height: height,
                        timestampNs: timestampNs
                    )
                }
                self.videoSink = sink
                videoTrack.add(sink)
            }
            if let apm = apm {
                let tap = RecorderAudioRenderTap(
                    muteOriginal: muteLoopbackPlayback
                ) { [weak self] pcmBuffer in
                    self?.handleAudioBuffer(pcmBuffer: pcmBuffer)
                }
                self.audioRenderTap = tap
                apm.renderPreProcessingDelegate = tap
                NSLog("[TracksRecorder] installed renderPreProcessingDelegate (muteLoopbackPlayback=%@)",
                      muteLoopbackPlayback ? "YES" : "NO")
            }

            if maxDurationMs > 0 {
                let timer = DispatchSource.makeTimerSource(queue: self.queue)
                timer.schedule(deadline: .now() + .milliseconds(maxDurationMs))
                timer.setEventHandler { [weak self] in
                    self?.stopRecording { }
                }
                timer.resume()
                self.autoStopTimer = timer
            }
        }
    }

    @objc public func stopRecording(completion: @escaping () -> Void) {
        queue.async { [weak self] in
            guard let self = self else {
                DispatchQueue.main.async { completion() }
                return
            }

            if !self.isRecording {
                DispatchQueue.main.async { completion() }
                return
            }

            self.autoStopTimer?.cancel()
            self.autoStopTimer = nil

            // Snapshot the audio render-tap's call count BEFORE detaching so
            // we have a definitive answer to "did the APM ever invoke our
            // tap?" — independent of any per-call log filtering.
            let audioTapCallCount = self.audioRenderTap?.callCount ?? -1
            NSLog("[TracksRecorder] stopRecording: audio render-tap total calls=%d",
                  audioTapCallCount)

            // Detach sinks/taps: no more new frames will arrive on our path.
            if let track = self.videoTrack, let sink = self.videoSink {
                track.remove(sink)
            }
            // Clear the render-tap delegate slot only if it's still ours —
            // if some other consumer has rotated in, leave theirs alone.
            if let apm = self.audioProcessingModule,
               let tap = self.audioRenderTap,
               apm.renderPreProcessingDelegate === tap {
                apm.renderPreProcessingDelegate = nil
            }
            self.videoSink = nil
            self.audioRenderTap = nil
            self.videoTrack = nil
            self.audioProcessingModule = nil

            // Capture refs we need on the off-queue drain.
            let session = self.compressionSession
            let writer = self.assetWriter
            let outputURL = self.outputURL
            let videoInput = self.videoInput
            let audioInput = self.audioInput

            // Mark not-recording so any in-flight handlers no-op cleanly.
            self.isRecording = false

            // If the writer never started (no encoded sample ever made it
            // out), there's nothing to finalise.
            guard let assetWriter = writer, assetWriter.status == .writing else {
                NSLog("[TracksRecorder] stopRecording: writer not in .writing (status=%ld) framesEncoded=%d samplesAppended=%d (no file produced)",
                      Int(writer?.status.rawValue ?? -1),
                      self.videoFramesEncoded,
                      self.videoSamplesAppended)
                if let session = session {
                    VTCompressionSessionInvalidate(session)
                }
                self.fireTerminalCompletion(url: nil, error: writer?.error as NSError?)
                self.cleanupAfterStop()
                DispatchQueue.main.async { completion() }
                return
            }

            // Drain the encoder OFF the recorder queue. CompleteFrames is
            // synchronous w.r.t. encoder output, but the output callback
            // dispatches each encoded sample back to our queue — so if we
            // were to block this queue waiting for the drain, the queued
            // sample handlers would never run. Hop off, drain, hop back.
            DispatchQueue.global(qos: .userInitiated).async {
                if let session = session {
                    VTCompressionSessionCompleteFrames(session, untilPresentationTimeStamp: .invalid)
                    VTCompressionSessionInvalidate(session)
                }

                self.queue.async {
                    videoInput?.markAsFinished()
                    audioInput?.markAsFinished()

                    assetWriter.finishWriting { [weak self] in
                        guard let self = self else {
                            DispatchQueue.main.async { completion() }
                            return
                        }
                        self.queue.async {
                            let resolved: URL? = (assetWriter.status == .completed) ? outputURL : nil
                            let writerError: NSError? = (assetWriter.status == .failed)
                                ? (assetWriter.error as NSError?)
                                : nil
                            NSLog("[TracksRecorder] finishWriting completed status=%ld framesEncoded=%d samplesAppended=%d failures=%d dropped=%d resolved=%@",
                                  assetWriter.status.rawValue,
                                  self.videoFramesEncoded,
                                  self.videoSamplesAppended,
                                  self.videoFrameAppendFailures,
                                  self.videoFramesDropped,
                                  resolved?.absoluteString ?? "nil")
                            self.fireTerminalCompletion(url: resolved, error: writerError)
                            self.cleanupAfterStop()
                            DispatchQueue.main.async { completion() }
                        }
                    }
                }
            }
        }
    }

    @objc public func clearRecordingsDirectory(completion: @escaping (NSError?) -> Void) {
        queue.async { [weak self] in
            guard let self = self else { return }
            let fm = FileManager.default
            do {
                let contents = try fm.contentsOfDirectory(
                    at: self.recordingsDirectory,
                    includingPropertiesForKeys: nil,
                    options: []
                )
                for url in contents {
                    try? fm.removeItem(at: url)
                }
                DispatchQueue.main.async { completion(nil) }
            } catch {
                DispatchQueue.main.async { completion(error as NSError) }
            }
        }
    }

    @objc public func listRecordings() -> [URL] {
        let fm = FileManager.default
        guard let contents = try? fm.contentsOfDirectory(
            at: recordingsDirectory,
            includingPropertiesForKeys: [.contentModificationDateKey],
            options: [.skipsHiddenFiles]
        ) else {
            return []
        }
        return contents.sorted { lhs, rhs in
            let lDate = (try? lhs.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? .distantPast
            let rDate = (try? rhs.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? .distantPast
            return lDate > rDate
        }
    }

    // MARK: - Sink callbacks

    private func handleVideoFrame(
        pixelBuffer: CVPixelBuffer,
        width: Int32,
        height: Int32,
        timestampNs: Int64
    ) {
        queue.async { [weak self, pixelBuffer] in
            guard let self = self, self.isRecording else { return }

            // Lazy-create the compression session on the first frame so we
            // know the actual buffer dimensions.
            if self.compressionSession == nil {
                let actualW = Int32(CVPixelBufferGetWidth(pixelBuffer))
                let actualH = Int32(CVPixelBufferGetHeight(pixelBuffer))
                NSLog("[TracksRecorder] creating VTCompressionSession for %dx%d", actualW, actualH)
                self.createCompressionSession(width: actualW, height: actualH)
            }
            guard let session = self.compressionSession else { return }

            // Establish the time origin on the first frame so PTS values
            // computed below are relative to the recording start.
            let absTimestamp = UInt64(bitPattern: timestampNs)
            if self.recordingStartHostTimeNs == nil {
                self.recordingStartHostTimeNs = absTimestamp
            }
            let origin = self.recordingStartHostTimeNs!
            let elapsed: Int64 = absTimestamp >= origin ? Int64(absTimestamp - origin) : 0
            let pts = CMTime(value: elapsed, timescale: 1_000_000_000)

            var infoFlags: VTEncodeInfoFlags = []
            let status = VTCompressionSessionEncodeFrame(
                session,
                imageBuffer: pixelBuffer,
                presentationTimeStamp: pts,
                duration: .invalid,
                frameProperties: nil,
                sourceFrameRefcon: nil,
                infoFlagsOut: &infoFlags
            )
            if status != noErr {
                NSLog("[TracksRecorder] VTCompressionSessionEncodeFrame failed status=%d", status)
                return
            }
            self.videoFramesEncoded += 1
        }
    }

    private func handleAudioBuffer(pcmBuffer: AVAudioPCMBuffer) {
        // RTCAudioRenderer hands us a buffer whose backing memory is owned
        // by WebRTC for the duration of this call. Copy it before hopping
        // queues so the data is still valid when we read it asynchronously.
        let captureTimeNs = TracksRecorderManager.currentHostTimeNs()
        guard let copy = AVAudioPCMBuffer(
            pcmFormat: pcmBuffer.format,
            frameCapacity: pcmBuffer.frameCapacity
        ) else { return }
        copy.frameLength = pcmBuffer.frameLength
        let frameLength = Int(pcmBuffer.frameLength)
        let channelCount = Int(pcmBuffer.format.channelCount)
        if let src = pcmBuffer.int16ChannelData, let dst = copy.int16ChannelData {
            for ch in 0..<channelCount {
                memcpy(dst[ch], src[ch], frameLength * MemoryLayout<Int16>.size)
            }
        } else if let src = pcmBuffer.floatChannelData, let dst = copy.floatChannelData {
            for ch in 0..<channelCount {
                memcpy(dst[ch], src[ch], frameLength * MemoryLayout<Float>.size)
            }
        } else if let src = pcmBuffer.int32ChannelData, let dst = copy.int32ChannelData {
            for ch in 0..<channelCount {
                memcpy(dst[ch], src[ch], frameLength * MemoryLayout<Int32>.size)
            }
        }

        queue.async { [weak self] in
            guard let self = self, self.isRecording, let writer = self.assetWriter else { return }

            if self.audioInput == nil && self.pendingAudio {
                self.configureAudioInput(format: copy.format)
                self.pendingAudio = false
                self.maybeStartSession()
            }

            guard writer.status == .writing,
                  let audioInput = self.audioInput,
                  audioInput.isReadyForMoreMediaData,
                  let origin = self.recordingStartHostTimeNs else {
                return
            }

            let elapsed: Int64 = captureTimeNs >= origin ? Int64(captureTimeNs - origin) : 0
            let pts = CMTime(value: elapsed, timescale: 1_000_000_000)
            guard let sampleBuffer = TracksRecorderManager.makeSampleBuffer(from: copy, pts: pts) else {
                return
            }
            audioInput.append(sampleBuffer)
        }
    }

    // MARK: - VTCompressionSession

    /// Creates the software-preferred H.264 compression session. Reads
    /// `kVTCompressionPropertyKey_UsingHardwareAcceleratedVideoEncoder`
    /// after creation so we can see in logs whether iOS honoured the
    /// software hint or fell back to hardware.
    ///
    /// **iOS version note.** The "force software" knob
    /// (`kVTVideoEncoderSpecification_EnableHardwareAcceleratedVideoEncoder`)
    /// is only available on **iOS 17.4+**. On older iOS the spec key
    /// doesn't exist; we omit it and the session uses iOS's only
    /// available H.264 encoder (hardware), which means hardware encoder
    /// contention with WebRTC's publisher will reappear. There's no
    /// public workaround on iOS < 17.4 — option B (buffer raw, encode
    /// after the call) is the fallback in that case.
    private func createCompressionSession(width: Int32, height: Int32) {
        var encoderSpec: [CFString: Any] = [:]
        if #available(iOS 17.4, *) {
            encoderSpec[kVTVideoEncoderSpecification_EnableHardwareAcceleratedVideoEncoder] = kCFBooleanFalse
            encoderSpec[kVTVideoEncoderSpecification_RequireHardwareAcceleratedVideoEncoder] = kCFBooleanFalse
        }

        var session: VTCompressionSession?
        let refcon = Unmanaged<TracksRecorderManager>.passUnretained(self).toOpaque()

        let status = VTCompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            width: width,
            height: height,
            codecType: kCMVideoCodecType_H264,
            encoderSpecification: encoderSpec.isEmpty ? nil : (encoderSpec as CFDictionary),
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: TracksRecorderManager.compressionOutputCallback,
            refcon: refcon,
            compressionSessionOut: &session
        )

        guard status == noErr, let session = session else {
            NSLog("[TracksRecorder] VTCompressionSessionCreate failed status=%d", status)
            let err = Self.error("compression_session_create_failed", code: 4)
            fireTerminalCompletion(url: nil, error: err)
            cleanupAfterFailure()
            return
        }

        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanTrue)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AllowFrameReordering, value: kCFBooleanFalse)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ProfileLevel, value: kVTProfileLevel_H264_Baseline_AutoLevel)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AverageBitRate, value: NSNumber(value: 1_000_000))
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_MaxKeyFrameIntervalDuration, value: NSNumber(value: 2.0))

        VTCompressionSessionPrepareToEncodeFrames(session)

        if #available(iOS 17.4, *) {
            var usingHardwareValue: CFTypeRef?
            VTSessionCopyProperty(
                session,
                key: kVTCompressionPropertyKey_UsingHardwareAcceleratedVideoEncoder,
                allocator: kCFAllocatorDefault,
                valueOut: &usingHardwareValue
            )
            let usingHardware = (usingHardwareValue as? Bool) ?? true
            NSLog("[TracksRecorder] VTCompressionSession ready usingHardware=%@",
                  usingHardware ? "YES" : "NO")
        } else {
            // Pre-iOS-17.4 cannot report this; assume hardware (the only
            // option iOS exposes for H.264 on these versions).
            NSLog("[TracksRecorder] VTCompressionSession ready (iOS < 17.4, hardware encoder)")
        }

        self.compressionSession = session
    }

    /// VT C-callback. We hop straight back onto the recorder queue with the
    /// encoded sample retained.
    private static let compressionOutputCallback: VTCompressionOutputCallback = { (
        outputCallbackRefCon,
        _,
        status,
        _,
        sampleBuffer
    ) -> Void in
        guard let refcon = outputCallbackRefCon else { return }
        let manager = Unmanaged<TracksRecorderManager>.fromOpaque(refcon).takeUnretainedValue()
        if status != noErr {
            NSLog("[TracksRecorder] compression callback status=%d", status)
            return
        }
        guard let sample = sampleBuffer else { return }
        manager.queue.async {
            manager.handleEncodedSample(sample)
        }
    }

    private func handleEncodedSample(_ sample: CMSampleBuffer) {
        guard let writer = assetWriter else { return }

        // Lazy-create the writer's video input on the first encoded sample.
        // Passthrough mode: outputSettings nil + sourceFormatHint from the
        // sample's format description. The writer just muxes the encoded
        // data into the MP4; no second encoder runs.
        if videoInput == nil {
            guard let formatDesc = CMSampleBufferGetFormatDescription(sample) else {
                NSLog("[TracksRecorder] encoded sample missing format description")
                return
            }
            let input = AVAssetWriterInput(
                mediaType: .video,
                outputSettings: nil,
                sourceFormatHint: formatDesc
            )
            input.expectsMediaDataInRealTime = true
            if writer.canAdd(input) {
                writer.add(input)
                self.videoInput = input
                self.pendingVideo = false
                NSLog("[TracksRecorder] passthrough video input added")
                self.maybeStartSession()
            } else {
                NSLog("[TracksRecorder] writer cannot add passthrough video input")
                return
            }
        }

        guard writer.status == .writing, let input = videoInput else {
            if writer.status == .failed {
                let err = writer.error as NSError?
                NSLog("[TracksRecorder] writer FAILED in encoded-sample handler: domain=%@ code=%ld desc=%@",
                      err?.domain ?? "nil", err?.code ?? 0,
                      err?.localizedDescription ?? "nil")
            }
            return
        }

        if !input.isReadyForMoreMediaData {
            videoFramesDropped += 1
            if videoFramesDropped % 30 == 1 {
                NSLog("[TracksRecorder] video input not ready, dropped=%d", videoFramesDropped)
            }
            return
        }

        let appended = input.append(sample)
        videoSamplesAppended += 1
        if !appended {
            videoFrameAppendFailures += 1
            let writerErr = writer.error as NSError?
            NSLog("[TracksRecorder] passthrough append FAILED #%d writerStatus=%ld writerErr domain=%@ code=%ld desc=%@",
                  videoFrameAppendFailures, writer.status.rawValue,
                  writerErr?.domain ?? "nil",
                  writerErr?.code ?? 0,
                  writerErr?.localizedDescription ?? "nil")
        } else if videoSamplesAppended == 1 {
            NSLog("[TracksRecorder] first encoded sample appended OK")
        }
    }

    // MARK: - Session lifecycle

    private func configureAudioInput(format: AVAudioFormat) {
        guard let writer = assetWriter else { return }
        let settings: [String: Any] = [
            AVFormatIDKey: NSNumber(value: kAudioFormatMPEG4AAC),
            AVSampleRateKey: NSNumber(value: format.sampleRate),
            AVNumberOfChannelsKey: NSNumber(value: format.channelCount),
            AVEncoderBitRateKey: NSNumber(value: 64_000),
        ]
        let input = AVAssetWriterInput(mediaType: .audio, outputSettings: settings)
        input.expectsMediaDataInRealTime = true
        if writer.canAdd(input) {
            writer.add(input)
            self.audioInput = input
        }
    }

    private func maybeStartSession() {
        guard let writer = assetWriter else { return }
        if pendingVideo || pendingAudio { return }
        if writer.status != .unknown { return }

        guard writer.startWriting() else {
            let err = (writer.error as NSError?) ?? Self.error("start_failed", code: 3)
            fireTerminalCompletion(url: nil, error: err)
            cleanupAfterFailure()
            return
        }
        // The session origin is `.zero`; PTS values were already computed
        // relative to `recordingStartHostTimeNs` when we called
        // `VTCompressionSessionEncodeFrame`, so the first encoded sample
        // already carries pts=0.
        writer.startSession(atSourceTime: .zero)
        NSLog("[TracksRecorder] writer.startWriting() + startSession(.zero)")
    }

    private func fireTerminalCompletion(url: URL?, error: NSError?) {
        guard !terminalBarrierFired else { return }
        terminalBarrierFired = true
        let cb = startCompletion
        startCompletion = nil
        DispatchQueue.main.async { cb?(url, error) }
    }

    private func cleanupAfterFailure() {
        if let track = videoTrack, let sink = videoSink { track.remove(sink) }
        if let apm = audioProcessingModule,
           let tap = audioRenderTap,
           apm.renderPreProcessingDelegate === tap {
            apm.renderPreProcessingDelegate = nil
        }
        if let session = compressionSession { VTCompressionSessionInvalidate(session) }
        autoStopTimer?.cancel()
        autoStopTimer = nil
        videoSink = nil
        audioRenderTap = nil
        videoInput = nil
        audioInput = nil
        compressionSession = nil
        assetWriter = nil
        outputURL = nil
        videoTrack = nil
        audioProcessingModule = nil
        isRecording = false
        recordingStartHostTimeNs = nil
        pendingVideo = false
        pendingAudio = false
    }

    private func cleanupAfterStop() {
        videoInput = nil
        audioInput = nil
        compressionSession = nil
        assetWriter = nil
        outputURL = nil
        recordingStartHostTimeNs = nil
        pendingVideo = false
        pendingAudio = false
        terminalBarrierFired = false
        startCompletion = nil
        videoFramesEncoded = 0
        videoSamplesAppended = 0
        videoFrameAppendFailures = 0
        videoFramesDropped = 0
    }

    // MARK: - Helpers

    private static func error(_ message: String, code: Int) -> NSError {
        NSError(
            domain: "io.stream.video.tracks-recorder",
            code: code,
            userInfo: [NSLocalizedDescriptionKey: message]
        )
    }

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
}
