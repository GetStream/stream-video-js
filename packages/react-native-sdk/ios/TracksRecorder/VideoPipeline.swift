//
// Copyright © 2026 Stream.io Inc. All rights reserved.
//

import AVFoundation
import CoreMedia
import CoreVideo
import Foundation
import WebRTC

/// Video pipeline owned by `TracksRecorderManager`. Encapsulates the H.264
/// video path:
///  - the `RecorderVideoSink` attached to the source `RTCVideoTrack`,
///  - an `AVAssetWriterInput` configured for H.264 encoding (codec, bitrate,
///    profile, key-frame interval) paired with an
///    `AVAssetWriterInputPixelBufferAdaptor` — AVFoundation owns the encoder
///    and picks hardware/software automatically. No manual VT session.
///  - per-recording counters / PTS range surfaced via `logSummary` at stop.
///
/// All state mutation runs on the host's serial queue. Frames arrive on the
/// WebRTC sink thread and re-dispatch onto `host.queue` before touching
/// pipeline state.
internal final class VideoPipeline {

    private static let bitRate: NSNumber = NSNumber(value: 1_000_000)

    private weak var host: PipelineHost?
    private let videoTrack: RTCVideoTrack

    private var sink: RecorderVideoSink?
    private var videoInput: AVAssetWriterInput?
    private var pixelBufferAdaptor: AVAssetWriterInputPixelBufferAdaptor?
    private var inputAdded = false

    // Diagnostic counters + PTS range, surfaced via [logSummary] at stop.
    private var framesReceived = 0
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

    /// On-queue. Marks the asset-writer input as finished so the writer
    /// can finalise. AVFoundation's `finishWriting` flushes any pending
    /// encoded samples internally; no separate drain step is required.
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
        let writerStatus = host?.assetWriter?.status.rawValue ?? -1
        let writerErr = (host?.assetWriter?.error as NSError?)?.localizedDescription ?? "nil"
        NSLog(
            "[TracksRecorder.Video] summary received=%d appended=%d appendFailures=%d dropped=%d firstPtsUs=%lld lastPtsUs=%lld durationMs=%lld writerStatus=%ld writerErr=%@",
            framesReceived,
            samplesAppended,
            frameAppendFailures,
            framesDropped,
            firstSamplePtsUs,
            lastSamplePtsUs,
            durationMs,
            writerStatus,
            writerErr
        )
    }

    // MARK: - Sink → queue bridge

    private func handleVideoFrame(
        pixelBuffer: CVPixelBuffer,
        width: Int32,
        height: Int32,
        timestampNs: Int64
    ) {
        guard let host = host else { return }

        // Pixel buffer is borrowed from the sink — it must be retained
        // across the queue hop. The closure capture pins it for the
        // duration of the async block (ARC retains it as part of the
        // closure's captured state).
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
        guard let host = host, host.isRecording, let writer = host.assetWriter else { return }

        framesReceived += 1

        // Lazy-create the writer's video input on the first frame so its
        // dimensions and pixel format match the actual buffer that WebRTC
        // is producing. Locking these at first-frame time avoids guessing
        // and survives whatever pixel format the sink hands us.
        if videoInput == nil {
            let actualW = Int32(CVPixelBufferGetWidth(pixelBuffer))
            let actualH = Int32(CVPixelBufferGetHeight(pixelBuffer))
            let pixelFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)
            configureVideoInput(
                width: actualW,
                height: actualH,
                pixelFormat: pixelFormat,
                writer: writer
            )
        }

        let pts = presentationTime(host: host, timestampNs: UInt64(bitPattern: timestampNs))

        guard
            writer.status == .writing,
            let input = videoInput,
            let adaptor = pixelBufferAdaptor
        else {
            if writer.status == .failed {
                let err = writer.error as NSError?
                NSLog("[TracksRecorder.Video] writer FAILED in frame handler: domain=%@ code=%ld desc=%@",
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

        let appended = adaptor.append(pixelBuffer, withPresentationTime: pts)
        if appended {
            samplesAppended += 1
            let ptsUs = Int64(CMTimeGetSeconds(pts) * 1_000_000)
            if firstSamplePtsUs < 0 || ptsUs < firstSamplePtsUs {
                firstSamplePtsUs = ptsUs
            }
            if ptsUs > lastSamplePtsUs {
                lastSamplePtsUs = ptsUs
            }
            if samplesAppended == 1 {
                NSLog("[TracksRecorder.Video] first frame appended OK pts=%lldus", ptsUs)
            }
        } else {
            // `adaptor.append` returns false without a direct reason —
            // inspect `writer.error` and the input's ready flag for
            // diagnostics.
            frameAppendFailures += 1
            let writerErr = writer.error as NSError?
            NSLog(
                "[TracksRecorder.Video] adaptor.append FAILED #%d writerStatus=%ld writerErr domain=%@ code=%ld desc=%@ inputReady=%@",
                frameAppendFailures,
                writer.status.rawValue,
                writerErr?.domain ?? "nil",
                writerErr?.code ?? 0,
                writerErr?.localizedDescription ?? "nil",
                input.isReadyForMoreMediaData ? "YES" : "NO"
            )
        }
    }

    // MARK: - Asset writer input setup

    /// Builds the H.264 `AVAssetWriterInput` and its pixel-buffer adaptor on
    /// the first frame. AVFoundation owns the encoder — it picks hardware
    /// when available and falls back to software transparently if the
    /// hardware H.264 pool is contended (e.g. by WebRTC's publisher).
    ///
    /// The pixel format passed in is read straight from the first frame's
    /// `CVPixelBuffer`, so we never lie to the adaptor about what we'll
    /// hand it. Mismatch → silent conversion or rejected frames.
    private func configureVideoInput(
        width: Int32,
        height: Int32,
        pixelFormat: OSType,
        writer: AVAssetWriter
    ) {
        let settings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: width,
            AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: VideoPipeline.bitRate,
            ],
        ]
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
        input.expectsMediaDataInRealTime = true

        let pbAttributes: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: pixelFormat,
            kCVPixelBufferWidthKey as String: width,
            kCVPixelBufferHeightKey as String: height,
        ]
        let adaptor = AVAssetWriterInputPixelBufferAdaptor(
            assetWriterInput: input,
            sourcePixelBufferAttributes: pbAttributes
        )

        guard writer.canAdd(input) else {
            NSLog("[TracksRecorder.Video] writer cannot add encoding video input")
            host?.onFatalError(makeRecorderError("video_input_add_failed", code: 4))
            return
        }

        writer.add(input)
        videoInput = input
        pixelBufferAdaptor = adaptor
        inputAdded = true
        host?.onTrackAdded()
    }
}
