//
// Copyright © 2026 Stream.io Inc. All rights reserved.
//

import AVFoundation
import CoreMedia
import Foundation
import WebRTC

/// Orchestrator for the React Native track recorder. Owns the
/// `AVAssetWriter`, the recording lifecycle, the writer-start gate, and
/// the terminal-completion barrier. Delegates the encoder + sink + drain
/// work to `VideoPipeline` and `AudioPipeline` respectively (composed via
/// `PipelineHost`).
///
/// The `startRecording` completion is the *lifecycle* signal — it fires once at the terminal moment of the
/// recording (auto-stop timer expired, manual stop, or fatal error),
/// carrying the resulting file URL or an error. The `stopRecording`
/// completion is just a synchronization point — `void` — so callers can
/// `await stopTrackRecording(); await getStreamRecordings()` without
/// racing the disk flush.
@objc public final class TracksRecorderManager: NSObject, PipelineHost {

    @objc public static let shared = TracksRecorderManager()

    // MARK: - Configuration

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

    // MARK: - PipelineHost

    let queue = DispatchQueue(label: "io.stream.video.tracks-recorder")

    private(set) var assetWriter: AVAssetWriter?
    private(set) var isRecording = false

    // MARK: - State

    private var videoPipeline: VideoPipeline?
    private var audioPipeline: AudioPipeline?

    private var outputURL: URL?
    private var recordingCompletion: ((URL?, NSError?) -> Void)?
    private var isCompleted = false

    private var pendingPipelines = 0
    private var recordingStartHostTimeNs: UInt64?
    private var autoStopTimer: DispatchSourceTimer?

    // MARK: - Public API

    @objc public func startRecording(
        videoTrackId: String?,
        maxDurationMs: Int,
        targetWidth: Int,
        targetHeight: Int,
        webRTCModule: WebRTCModule,
        completion: @escaping (URL?, NSError?) -> Void
    ) {
        queue.async { [weak self] in
            guard let self = self else { return }

            if self.isRecording {
                completion(nil, makeRecorderError("recording_in_progress", code: 1))
                return
            }

            let videoTrack = videoTrackId
                .flatMap { webRTCModule.track(forId: $0) } as? RTCVideoTrack

            // Resolve the APM for the render-side audio tap before opening
            // any files — so a missing/incompatible APM fails fast. Audio
            // is captured through the APM render-pre delegate (post-mix
            // decoded audio); no per-track lookup is needed.
            let apmId = WebRTCModuleOptions.sharedInstance().audioProcessingModule
            guard let apm = apmId as? RTCDefaultAudioProcessingModule else {
                completion(nil, makeRecorderError("audio_processing_module_unavailable", code: 5))
                return
            }
            if apm.renderPreProcessingDelegate != nil {
                completion(nil, makeRecorderError("recording_blocked_by_audio_render_tap", code: 6))
                return
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
            self.recordingCompletion = completion
            self.isCompleted = false
            self.recordingStartHostTimeNs = nil
            self.pendingPipelines = 0
            self.isRecording = true

            if let videoTrack = videoTrack {
                let pipeline = VideoPipeline(
                    host: self,
                    videoTrack: videoTrack,
                    targetWidth: Int32(targetWidth),
                    targetHeight: Int32(targetHeight)
                )
                self.videoPipeline = pipeline
                self.pendingPipelines += 1
                pipeline.start()
            }

            let audio = AudioPipeline(host: self, apm: apm)
            self.audioPipeline = audio
            self.pendingPipelines += 1
            audio.start()

            if maxDurationMs > 0 {
                let timer = DispatchSource.makeTimerSource(queue: self.queue)
                timer.schedule(deadline: .now() + .milliseconds(maxDurationMs))
                timer.setEventHandler { [weak self] in
                    self?.stopRecording { }
                }
                timer.resume()
                self.autoStopTimer = timer
            }

            NSLog("[TracksRecorder] recording started video=%@ audio=YES → %@",
                  videoTrack != nil ? "YES" : "NO",
                  outputURL.absoluteString)
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

            // Detach sinks/taps so no more frames arrive on the recorder path.
            self.videoPipeline?.detachSink()
            self.audioPipeline?.detachSink()

            let video = self.videoPipeline
            let audio = self.audioPipeline
            let writer = self.assetWriter
            let outputURL = self.outputURL

            self.isRecording = false

            // If the writer never started (no encoded sample ever made it
            // out), there's nothing to finalise.
            guard let assetWriter = writer, assetWriter.status == .writing else {
                NSLog("[TracksRecorder] stopRecording: writer not in .writing (status=%ld) — no file produced",
                      Int(writer?.status.rawValue ?? -1))
                video?.logSummary()
                audio?.logSummary()
                self.fireTerminalCompletion(url: nil, error: writer?.error as NSError?)
                self.cleanupAfterStop()
                DispatchQueue.main.async { completion() }
                return
            }

            video?.markInputAsFinished()
            audio?.markInputAsFinished()

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
                    video?.logSummary()
                    audio?.logSummary()
                    NSLog("[TracksRecorder] recording finalised → %@",
                          resolved?.absoluteString ?? "(no file produced)")
                    self.fireTerminalCompletion(url: resolved, error: writerError)
                    self.cleanupAfterStop()
                    DispatchQueue.main.async { completion() }
                }
            }
        }
    }

    @objc public func clearRecordingsDirectory(completion: @escaping (NSError?) -> Void) {
        queue.async { [weak self] in
            guard let self = self else { return }
            if self.isRecording {
                DispatchQueue.main.async {
                    completion(makeRecorderError("recording_in_progress", code: 1))
                }
                return
            }
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

    // MARK: - PipelineHost

    func seedOriginNs(_ timestampNs: UInt64) -> UInt64 {
        if let existing = recordingStartHostTimeNs { return existing }
        recordingStartHostTimeNs = timestampNs
        return timestampNs
    }

    func onTrackAdded() {
        pendingPipelines = max(0, pendingPipelines - 1)
        maybeStartSession()
    }

    func onFatalError(_ error: NSError) {
        fireTerminalCompletion(url: nil, error: error)
        cleanupAfterFailure()
    }

    // MARK: - Internal helpers

    /// Starts the writer once every active pipeline has reported its input
    /// added. Calling `startWriting()` / `startSession(.zero)` before all
    /// inputs are present would leave un-added tracks orphaned; the gate
    /// is load-bearing.
    private func maybeStartSession() {
        guard let writer = assetWriter else { return }
        if pendingPipelines > 0 { return }
        if writer.status != .unknown { return }

        guard writer.startWriting() else {
            let err = (writer.error as NSError?) ?? makeRecorderError("start_failed", code: 3)
            fireTerminalCompletion(url: nil, error: err)
            cleanupAfterFailure()
            return
        }
        // The session origin is `.zero`; PTS values are computed relative
        // to `recordingStartHostTimeNs` before being passed to
        // `VTCompressionSessionEncodeFrame`, so the first encoded sample
        // already carries pts=0.
        writer.startSession(atSourceTime: .zero)
        NSLog("[TracksRecorder] writer.startWriting() + startSession(.zero)")
    }

    private func fireTerminalCompletion(url: URL?, error: NSError?) {
        guard !isCompleted else { return }
        isCompleted = true
        let cb = recordingCompletion
        recordingCompletion = nil
        DispatchQueue.main.async { cb?(url, error) }
    }

    private func cleanupAfterFailure() {
        videoPipeline?.detachSink()
        audioPipeline?.detachSink()
        autoStopTimer?.cancel()
        autoStopTimer = nil
        resetTransientState()
    }

    private func cleanupAfterStop() {
        resetTransientState()
    }

    /// Resets every transient field to its initial value. Single source of
    /// truth for "the manager is between recordings". Does NOT release
    /// native resources — the caller must have already torn down the
    /// pipelines and the writer.
    private func resetTransientState() {
        videoPipeline = nil
        audioPipeline = nil
        assetWriter = nil
        outputURL = nil
        recordingCompletion = nil
        isCompleted = false
        isRecording = false
        pendingPipelines = 0
        recordingStartHostTimeNs = nil
        autoStopTimer?.cancel()
        autoStopTimer = nil
    }
}
