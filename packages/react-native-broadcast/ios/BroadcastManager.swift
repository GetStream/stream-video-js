import AVFoundation
import Foundation
import HaishinKit
import RTMPHaishinKit

@objc
public class BroadcastManager: NSObject {

    // MARK: - Multi-instance APIs

    @objc(createInstance)
    public static func createInstance() -> String {
        return UUID().uuidString
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

        Task {
            do {
                let audioSourceService = AudioSourceService()
                await audioSourceService.setUp()

                let mixer = MediaMixer(captureSessionMode: .single)
                try await mixer.setFrameRate(30)

                await mixer.configuration { session in
                    session.automaticallyConfiguresApplicationAudioSession = false
                    session.sessionPreset = .hd1280x720
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
                audioSettings.bitRate = 48_000
                try await session.stream.setAudioSettings(audioSettings)

                var videoSettings = await session.stream.videoSettings
                videoSettings.isLowLatencyRateControlEnabled = false
                videoSettings.bitRateMode = .average
                videoSettings.bitRate = 2_500_000
                videoSettings.videoSize = CGSize(width: 720, height: 1280)
                try await session.stream.setVideoSettings(videoSettings)

                try await session.connect {
                    print("[Broadcast][\(instanceId)] RTMP connected")
                }

                // Save state
                state.mixer = mixer
                state.audioSourceService = audioSourceService
                state.session = session
                state.isRunning = true

                // Emit events: started and current media state
                BroadcastEventEmitter.emit("broadcast.started", body: [
                    "instanceId": instanceId,
                    "running": true
                ])
                BroadcastEventEmitter.emit("broadcast.mediaStateUpdated", body: [
                    "instanceId": instanceId,
                    "cameraEnabled": state.cameraEnabled,
                    "microphoneEnabled": state.micEnabled,
                    "cameraDirection": state.cameraPosition == .back ? "back" : "front"
                ])

                completion(nil)
            } catch {
                print("[Broadcast][\(instanceId)] start error: \(error)")
                await BroadcastManager.cleanupInstance(instanceId: instanceId)
                BroadcastEventEmitter.emit("broadcast.started", body:[
                    "instanceId": instanceId,
                    "running": false
                ])
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
            await BroadcastManager.cleanupInstance(instanceId: instanceId)
            BroadcastEventEmitter.emit("broadcast.started", body: [
                "instanceId": instanceId,
                "running": false
            ])
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
        // Emit media state update
        BroadcastEventEmitter.emit("broadcast.mediaStateUpdated", body: [
            "instanceId": instanceId,
            "cameraEnabled": state.cameraEnabled,
            "microphoneEnabled": state.micEnabled,
            "cameraDirection": position == .back ? "back" : "front"
        ])
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
        // Emit media state update
        BroadcastEventEmitter.emit("broadcast.mediaStateUpdated", body:[
            "instanceId": instanceId,
            "cameraEnabled": state.cameraEnabled,
            "microphoneEnabled": state.micEnabled,
            "cameraDirection": state.cameraPosition == .back ? "back" : "front"
        ])
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
        // Emit media state update
        BroadcastEventEmitter.emit("broadcast.mediaStateUpdated", body:[
            "instanceId": instanceId,
            "cameraEnabled": state.cameraEnabled,
            "microphoneEnabled": state.micEnabled,
            "cameraDirection": state.cameraPosition == .back ? "back" : "front"
        ])
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

    // Per-instance cleanup
    @MainActor
    private static func cleanupInstance(instanceId: String) {
        let state = BroadcastRegistry.shared.state(for: instanceId)
        state.reset()
    }
}
