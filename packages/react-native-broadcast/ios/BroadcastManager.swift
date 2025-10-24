import AVFoundation
import Foundation
import HaishinKit
import RTMPHaishinKit

@objc
public class BroadcastManager: NSObject {

    // MARK: - Multi-instance APIs

    @objc(createInstanceWithPreset:)
    public static func createInstance(preset: BroadcastPreset) -> String {
        let id = UUID().uuidString
        let state = BroadcastRegistry.shared.state(for: id)
        state.withPreset(preset: preset)
        return id
    }

    @objc(destroyInstanceWithInstanceId:)
    public static func destroyInstance(instanceId: String) {
        BroadcastRegistry.shared.remove(instanceId)
    }

    @objc(startWithInstanceId:endpoint:streamName:completion:)
    public static func start(
        instanceId: String,
        endpoint: String,
        streamName: String,
        completion: @escaping (NSError?) -> Void
    ) {
        let state = BroadcastRegistry.shared.state(for: instanceId)

        print("[Broadcast][\(instanceId)] start called")
        if state.isRunning {
            print("[Broadcast][\(instanceId)] already running, ignoring start")
            completion(nil)
            return
        }

        // Compose URL
        let fullURLString: String
        if streamName.isEmpty {
            fullURLString = endpoint
        } else if endpoint.hasSuffix("/") {
            fullURLString = endpoint + streamName
        } else {
            fullURLString = endpoint + "/" + streamName
        }
        guard let url = URL(string: fullURLString), let scheme = url.scheme,
            scheme == "rtmp" || scheme == "rtmps"
        else {
            completion(
                NSError(
                    domain: "Broadcast",
                    code: -1,
                    userInfo: [
                        NSLocalizedDescriptionKey:
                            "Invalid RTMP endpoint or stream name"
                    ]
                )
            )
            return
        }

        state.lastURL = url
        state.shouldReconnect = true
        state.reconnectAttempts = 0

        Task {
            do {
                let audioSourceService = AudioSourceService()
                await audioSourceService.setUp()

                let mixer = MediaMixer(captureSessionMode: .single)
                try await mixer.setFrameRate(state.preset.frameRate)

                await mixer.configuration { session in
                    session.automaticallyConfiguresApplicationAudioSession =
                        false
                    // Choose a capture preset based on desired dimensions (best-effort)
                    if max(state.preset.width, state.preset.height) >= 1920 {
                        session.sessionPreset = .hd1920x1080
                    } else {
                        session.sessionPreset = .hd1280x720
                    }
                }
                await mixer.setMonitoringEnabled(
                    DeviceUtil.isHeadphoneConnected()
                )

                var videoMixerSettings = await mixer.videoMixerSettings
                videoMixerSettings.mode = .offscreen
                await mixer.setVideoMixerSettings(videoMixerSettings)

                // Attach devices based on current state
                if state.cameraEnabled {
                    let position = state.cameraPosition
                    let camera = AVCaptureDevice.default(
                        .builtInWideAngleCamera,
                        for: .video,
                        position: position
                    )
                    try? await mixer.attachVideo(camera, track: 0) { unit in
                        unit.isVideoMirrored = position == .front
                    }
                }

                if state.micEnabled {
                    let mic = AVCaptureDevice.default(for: .audio)
                    try? await mixer.attachAudio(mic)
                }

                await mixer.startCapturing()
                await mixer.startRunning()

                let factory = RTMPSessionFactory()
                let session = factory.make(
                    url,
                    mode: .publish,
                    configuration: nil
                )

                await mixer.addOutput(session.stream)

                var audioSettings = await session.stream.audioSettings
                audioSettings.format = .aac
                audioSettings.bitRate = state.preset.audioBitrate
                try await session.stream.setAudioSettings(audioSettings)

                var videoSettings = await session.stream.videoSettings
                videoSettings.isLowLatencyRateControlEnabled = false
                videoSettings.bitRateMode = .average
                videoSettings.bitRate = state.preset.videoBitrate
                videoSettings.videoSize = CGSize(
                    width: state.preset.width,
                    height: state.preset.height
                )
                try await session.stream.setVideoSettings(videoSettings)

                try await session.connect {
                    print(
                        "[Broadcast][\(instanceId)] RTMP connection closed unexpectedly"
                    )
                    BroadcastManager.scheduleReconnect(instanceId: instanceId)
                }

                print("[Broadcast][\(instanceId)] RTMP connected")

                // Save state
                state.mixer = mixer
                state.audioSourceService = audioSourceService
                state.session = session
                state.isRunning = true

                completion(nil)
            } catch {
                print("[Broadcast][\(instanceId)] start error: \(error)")
                await BroadcastManager.cleanupInstance(instanceId: instanceId)
                completion(error as NSError)
            }
        }
    }

    @objc(stopWithInstanceId:completion:)
    public static func stop(
        instanceId: String,
        completion: @escaping (NSError?) -> Void
    ) {
        print("[Broadcast][\(instanceId)] stop called")
        let state = BroadcastRegistry.shared.state(for: instanceId)
        guard state.isRunning else {
            completion(nil)
            return
        }
        Task {
            // Disable any auto-reconnects and cancel pending tasks
            state.shouldReconnect = false
            state.reconnectTask?.cancel()
            state.reconnectTask = nil

            if let session = state.session {
                try? await session.close()
            }
            if let mixer = state.mixer {
                await mixer.stopRunning()
                await mixer.stopCapturing()
                try? await mixer.attachAudio(nil)
                try? await mixer.attachVideo(nil, track: 0)
                if let session = state.session {
                    await mixer.removeOutput(session.stream)
                }
            }
            // Reactive emission via didSet
            state.isRunning = false
            await BroadcastManager.cleanupInstance(instanceId: instanceId)
            completion(nil)
        }
    }

    @objc(setCameraDirectionWithInstanceId:direction:)
    public static func setCameraDirection(
        instanceId: String,
        direction: String
    ) {
        let state = BroadcastRegistry.shared.state(for: instanceId)
        let position: AVCaptureDevice.Position =
            (direction.lowercased() == "back") ? .back : .front
        state.cameraPosition = position
        guard let mixer = state.mixer else { return }
        Task {
            let camera = AVCaptureDevice.default(
                .builtInWideAngleCamera,
                for: .video,
                position: position
            )
            try? await mixer.attachVideo(camera, track: 0) { unit in
                unit.isVideoMirrored = position == .front
            }
        }
    }

    @objc(setCameraEnabledWithInstanceId:enabled:)
    public static func setCameraEnabled(
        instanceId: String,
        enabled: Bool
    ) {
        let state = BroadcastRegistry.shared.state(for: instanceId)
        state.cameraEnabled = enabled
        guard let mixer = state.mixer else { return }
        Task {
            if enabled {
                let position = state.cameraPosition
                let camera = AVCaptureDevice.default(
                    .builtInWideAngleCamera,
                    for: .video,
                    position: position
                )
                try? await mixer.attachVideo(camera, track: 0) { unit in
                    unit.isVideoMirrored = position == .front
                }
            } else {
                try? await mixer.attachVideo(nil, track: 0)
            }
        }
    }

    @objc(setMicrophoneEnabledWithInstanceId:enabled:)
    public static func setMicrophoneEnabled(
        instanceId: String,
        enabled: Bool
    ) {
        let state = BroadcastRegistry.shared.state(for: instanceId)
        state.micEnabled = enabled
        guard let mixer = state.mixer else { return }
        Task {
            if enabled {
                let mic = AVCaptureDevice.default(for: .audio)
                try? await mixer.attachAudio(mic)
            } else {
                try? await mixer.attachAudio(nil)
            }
        }
    }

    // Schedule a reconnect with exponential backoff using the current session.
    private static func scheduleReconnect(instanceId: String) {
        let state = BroadcastRegistry.shared.state(for: instanceId)
        guard state.shouldReconnect, state.isRunning else { return }

        let nextAttempt = state.reconnectAttempts + 1
        if nextAttempt > state.maxReconnectAttempts {
            print(
                "[Broadcast][\(instanceId)] Reconnect: max attempts reached, giving up"
            )
            Task { @MainActor in
                state.isRunning = false
                BroadcastManager.cleanupInstance(instanceId: instanceId)
            }
            return
        }
        state.reconnectAttempts = nextAttempt

        let delay = min(2.5, pow(2.0, Double(nextAttempt - 1)))
        print(
            "[Broadcast][\(instanceId)] Reconnect scheduled in \(delay)s (attempt \(nextAttempt)/\(state.maxReconnectAttempts))"
        )

        state.reconnectTask?.cancel()
        state.reconnectTask = Task { [instanceId] in
            do {
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))

                let state = BroadcastRegistry.shared.state(for: instanceId)
                guard state.shouldReconnect, state.isRunning,let session = state.session else { return }

                try await session.close()
                try await session.connect {
                    print(
                        "[Broadcast][\(instanceId)] RTMP connection closed unexpectedly"
                    )
                    BroadcastManager.scheduleReconnect(instanceId: instanceId)
                }

                print("[Broadcast][\(instanceId)] RTMP reconnected")
                state.reconnectAttempts = 0
            } catch {
                print(
                    "[Broadcast][\(instanceId)] Reconnect task error: \(error)"
                )
            }
        }
    }

    // Per-instance cleanup
    @MainActor
    private static func cleanupInstance(instanceId: String) {
        let state = BroadcastRegistry.shared.state(for: instanceId)
        state.reset()
    }
}
