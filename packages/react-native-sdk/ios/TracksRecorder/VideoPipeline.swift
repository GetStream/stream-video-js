//
// Copyright © 2026 Stream.io Inc. All rights reserved.
//

import AVFoundation
import CoreMedia
import CoreVideo
import Foundation
import VideoToolbox
import WebRTC

/// Video pipeline owned by `TracksRecorderManager`. Encapsulates everything
/// specific to the H.264 video path:
///  - the `RecorderVideoSink` attached to the source `RTCVideoTrack`,
///  - the `VTCompressionSession` (software-encoder hint) plus its output
///    callback bridging encoded samples back to the host queue,
///  - the passthrough `AVAssetWriterInput` (`outputSettings: nil` so the
///    writer only muxes, never re-encodes),
///  - per-recording counters / PTS range surfaced via `logSummary` at stop.
///
/// All state mutation runs on the host's serial queue. The VT compression
/// output callback runs on a VT-internal thread and re-dispatches onto
/// `host.queue` before touching pipeline state.
internal final class VideoPipeline {

    // MARK: - Configuration

    private static let bitRate: NSNumber = NSNumber(value: 1_000_000)
    private static let maxKeyFrameIntervalDurationSeconds: NSNumber = NSNumber(value: 2.0)

    // MARK: - Collaborators

    private weak var host: PipelineHost?
    private let videoTrack: RTCVideoTrack

    // MARK: - State

    private var sink: RecorderVideoSink?
    private var compressionSession: VTCompressionSession?
    private var videoInput: AVAssetWriterInput?
    /// Set once the asset-writer input has been added to the writer.
    private var inputAdded = false

    // Diagnostic counters + PTS range, surfaced via [logSummary] at stop.
    private var framesEncoded = 0
    private var samplesAppended = 0
    private var frameAppendFailures = 0
    private var framesDropped = 0
    private var firstSamplePtsUs: Int64 = -1
    private var lastSamplePtsUs: Int64 = -1

    // MARK: - Init

    init(host: PipelineHost, videoTrack: RTCVideoTrack) {
        self.host = host
        self.videoTrack = videoTrack
    }

    // MARK: - Public API

    /// Attach the sink to the source track. Future frames post to
    /// `host.queue` and run through the per-frame handler.
    func start() {
        let sink = RecorderVideoSink { [weak self] pixelBuffer, width, height, timestampNs in
            self?.handleVideoFrame(
                pixelBuffer: pixelBuffer,
                width: width,
                height: height,
                timestampNs: timestampNs
            )
        }
        self.sink = sink
        videoTrack.add(sink)
    }

    /// On-queue. Remove the sink from the source track so no more frames
    /// arrive. Idempotent.
    func detachSink() {
        if let sink = sink {
            videoTrack.remove(sink)
        }
        sink = nil
    }

    /// **Off-queue**. Synchronously completes the VT encoder and invalidates
    /// the session. Called from a global queue by the host's stop sequence
    /// because `CompleteFrames` is synchronous w.r.t. encoder output, but
    /// the output callback dispatches back to the host's queue — blocking
    /// the host queue waiting for the drain would deadlock the queued
    /// sample handlers.
    func completeFramesAndInvalidate() {
        if let session = compressionSession {
            VTCompressionSessionCompleteFrames(session, untilPresentationTimeStamp: .invalid)
            VTCompressionSessionInvalidate(session)
        }
        compressionSession = nil
    }

    /// On-queue. Marks the asset-writer input as finished so the writer
    /// can finalise. Called by the host after `completeFramesAndInvalidate`
    /// has drained the encoder.
    func markInputAsFinished() {
        videoInput?.markAsFinished()
    }

    /// On-queue. Logs the pipeline's diagnostic summary — call once at the
    /// end of a recording.
    func logSummary() {
        let durationMs: Int64
        if firstSamplePtsUs >= 0 && lastSamplePtsUs >= firstSamplePtsUs {
            durationMs = (lastSamplePtsUs - firstSamplePtsUs) / 1000
        } else {
            durationMs = -1
        }
        NSLog(
            "[TracksRecorder.Video] summary encoded=%d appended=%d appendFailures=%d dropped=%d firstPtsUs=%lld lastPtsUs=%lld durationMs=%lld",
            framesEncoded,
            samplesAppended,
            frameAppendFailures,
            framesDropped,
            firstSamplePtsUs,
            lastSamplePtsUs,
            durationMs
        )
    }

    // MARK: - Sink → queue bridge

    private func handleVideoFrame(
        pixelBuffer: CVPixelBuffer,
        width: Int32,
        height: Int32,
        timestampNs: Int64
    ) {
        // Pixel buffer is borrowed from the sink — it must be retained
        // across the queue hop. The closure capture pins it for the
        // duration of the async block (ARC retains it as part of the
        // closure's captured state).
        guard let host = host else { return }
        host.queue.async { [weak self, pixelBuffer] in
            self?.handleVideoFrameOnQueue(
                pixelBuffer: pixelBuffer,
                width: width,
                height: height,
                timestampNs: timestampNs
            )
        }
    }

    private func handleVideoFrameOnQueue(
        pixelBuffer: CVPixelBuffer,
        width: Int32,
        height: Int32,
        timestampNs: Int64
    ) {
        guard let host = host, host.isRecording else { return }

        // Lazy-create the compression session on the first frame so its
        // dimensions match the actual buffer.
        if compressionSession == nil {
            let actualW = Int32(CVPixelBufferGetWidth(pixelBuffer))
            let actualH = Int32(CVPixelBufferGetHeight(pixelBuffer))
            NSLog("[TracksRecorder.Video] creating VTCompressionSession for %dx%d", actualW, actualH)
            createCompressionSession(width: actualW, height: actualH)
        }
        guard let session = compressionSession else { return }

        let absTimestamp = UInt64(bitPattern: timestampNs)
        let origin = host.seedOriginNs(absTimestamp)
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
            NSLog("[TracksRecorder.Video] VTCompressionSessionEncodeFrame failed status=%d", status)
            return
        }
        framesEncoded += 1
    }

    // MARK: - VTCompressionSession

    /// Creates the software-preferred H.264 compression session. Reads
    /// `kVTCompressionPropertyKey_UsingHardwareAcceleratedVideoEncoder`
    /// after creation and logs whether iOS honoured the software hint
    /// or fell back to hardware.
    ///
    /// **iOS version note.** The "force software" knob
    /// (`kVTVideoEncoderSpecification_EnableHardwareAcceleratedVideoEncoder`)
    /// is only available on **iOS 17.4+**. On older iOS the spec key
    /// doesn't exist and the session uses iOS's only available H.264
    /// encoder (hardware), which means hardware encoder contention with
    /// WebRTC's publisher reappears. No public workaround exists on
    /// iOS < 17.4.
    private func createCompressionSession(width: Int32, height: Int32) {
        var encoderSpec: [CFString: Any] = [:]
        if #available(iOS 17.4, *) {
            encoderSpec[kVTVideoEncoderSpecification_EnableHardwareAcceleratedVideoEncoder] = kCFBooleanFalse
            encoderSpec[kVTVideoEncoderSpecification_RequireHardwareAcceleratedVideoEncoder] = kCFBooleanFalse
        }

        var session: VTCompressionSession?
        // Pass an unmanaged reference to this pipeline through the VT
        // refcon — the callback unwraps it to dispatch encoded samples
        // back to the pipeline. Unretained because the pipeline outlives
        // any in-flight callback (we tear down the session before
        // releasing the pipeline).
        let refcon = Unmanaged<VideoPipeline>.passUnretained(self).toOpaque()

        let status = VTCompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            width: width,
            height: height,
            codecType: kCMVideoCodecType_H264,
            encoderSpecification: encoderSpec.isEmpty ? nil : (encoderSpec as CFDictionary),
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: VideoPipeline.compressionOutputCallback,
            refcon: refcon,
            compressionSessionOut: &session
        )

        guard status == noErr, let session = session else {
            NSLog("[TracksRecorder.Video] VTCompressionSessionCreate failed status=%d", status)
            host?.onFatalError(makeRecorderError("compression_session_create_failed", code: 4))
            return
        }

        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanTrue)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AllowFrameReordering, value: kCFBooleanFalse)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ProfileLevel, value: kVTProfileLevel_H264_Baseline_AutoLevel)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AverageBitRate, value: VideoPipeline.bitRate)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_MaxKeyFrameIntervalDuration, value: VideoPipeline.maxKeyFrameIntervalDurationSeconds)

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
            NSLog("[TracksRecorder.Video] VTCompressionSession ready usingHardware=%@",
                  usingHardware ? "YES" : "NO")
        } else {
            // Pre-iOS-17.4 cannot report this; assume hardware (the only
            // option iOS exposes for H.264 on these versions).
            NSLog("[TracksRecorder.Video] VTCompressionSession ready (iOS < 17.4, hardware encoder)")
        }

        compressionSession = session
    }

    /// VT C-callback. Hops back onto the host queue with the encoded sample.
    private static let compressionOutputCallback: VTCompressionOutputCallback = { (
        outputCallbackRefCon,
        _,
        status,
        _,
        sampleBuffer
    ) -> Void in
        guard let refcon = outputCallbackRefCon else { return }
        let pipeline = Unmanaged<VideoPipeline>.fromOpaque(refcon).takeUnretainedValue()
        if status != noErr {
            NSLog("[TracksRecorder.Video] compression callback status=%d", status)
            return
        }
        guard let sample = sampleBuffer else { return }
        guard let host = pipeline.host else { return }
        host.queue.async {
            pipeline.handleEncodedSampleOnQueue(sample)
        }
    }

    // MARK: - Encoded sample → writer

    private func handleEncodedSampleOnQueue(_ sample: CMSampleBuffer) {
        guard let host = host, let writer = host.assetWriter else { return }

        // Lazy-create the writer's video input on the first encoded sample.
        // Passthrough mode: outputSettings nil + sourceFormatHint from the
        // sample's format description. The writer just muxes the encoded
        // data into the MP4; no second encoder runs.
        if videoInput == nil {
            guard let formatDesc = CMSampleBufferGetFormatDescription(sample) else {
                NSLog("[TracksRecorder.Video] encoded sample missing format description")
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
                videoInput = input
                inputAdded = true
                NSLog("[TracksRecorder.Video] passthrough video input added")
                host.onTrackAdded()
            } else {
                NSLog("[TracksRecorder.Video] writer cannot add passthrough video input")
                return
            }
        }

        guard writer.status == .writing, let input = videoInput else {
            if writer.status == .failed {
                let err = writer.error as NSError?
                NSLog("[TracksRecorder.Video] writer FAILED in encoded-sample handler: domain=%@ code=%ld desc=%@",
                      err?.domain ?? "nil", err?.code ?? 0,
                      err?.localizedDescription ?? "nil")
            }
            return
        }

        if !input.isReadyForMoreMediaData {
            framesDropped += 1
            if framesDropped % 30 == 1 {
                NSLog("[TracksRecorder.Video] input not ready, dropped=%d", framesDropped)
            }
            return
        }

        let appended = input.append(sample)
        if appended {
            samplesAppended += 1
            let ptsUs = Int64(CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample)) * 1_000_000)
            if firstSamplePtsUs < 0 || ptsUs < firstSamplePtsUs {
                firstSamplePtsUs = ptsUs
            }
            if ptsUs > lastSamplePtsUs {
                lastSamplePtsUs = ptsUs
            }
            if samplesAppended == 1 {
                NSLog("[TracksRecorder.Video] first encoded sample appended OK")
            }
        } else {
            frameAppendFailures += 1
            let writerErr = writer.error as NSError?
            NSLog("[TracksRecorder.Video] passthrough append FAILED #%d writerStatus=%ld writerErr domain=%@ code=%ld desc=%@",
                  frameAppendFailures, writer.status.rawValue,
                  writerErr?.domain ?? "nil",
                  writerErr?.code ?? 0,
                  writerErr?.localizedDescription ?? "nil")
        }
    }
}
