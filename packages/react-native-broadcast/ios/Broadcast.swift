import AVFoundation
import Foundation
import HaishinKit
import RTMPHaishinKit

@objc
public class BroadcastManager: NSObject {
    @objc public static let shared = BroadcastManager()

    var mixer: MediaMixer?
    var audioSourceService: AudioSourceService?
    var session: Session?

    var isRunning: Bool = false
    var cameraPosition: AVCaptureDevice.Position = .front
    var cameraEnabled: Bool = true
    var micEnabled: Bool = true

    private override init() {
        super.init()
    }
}

@objc
public class BroadcastSwift: NSObject {

    // MARK: - Public Bridged APIs

    @objc(startWithEndpoint:streamName:completion:)
    public static func start(endpoint: String, streamName: String, completion: @escaping (NSError?) -> Void) {
        print("[Broadcast] start called")
        if BroadcastManager.shared.isRunning {
            print("[Broadcast] already running, ignoring start")
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
        guard let url = URL(string: fullURLString), let scheme = url.scheme, scheme == "rtmp" || scheme == "rtmps" else {
            completion(NSError(domain: "Broadcast", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid RTMP endpoint or stream name"]))
            return
        }

        Task {
            do {
                let audioSourceService = AudioSourceService()
                await audioSourceService.setUp()

                let mixer = MediaMixer(captureSessionMode: .single)
                await mixer.configuration { session in
                    session.automaticallyConfiguresApplicationAudioSession = false
                    session.sessionPreset = .hd1280x720
                }
                await mixer.setMonitoringEnabled(DeviceUtil.isHeadphoneConnected())

                var videoMixerSettings = await mixer.videoMixerSettings
                videoMixerSettings.mode = .offscreen
                await mixer.setVideoMixerSettings(videoMixerSettings)

                // Attach devices based on current state
                if BroadcastManager.shared.cameraEnabled {
                    let position = BroadcastManager.shared.cameraPosition
                    let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
                    try? await mixer.attachVideo(camera, track: 0) { unit in
                        unit.isVideoMirrored = position == .front
                    }
                }
                if BroadcastManager.shared.micEnabled {
                    let mic = AVCaptureDevice.default(for: .audio)
                    try? await mixer.attachAudio(mic)
                }

                await mixer.startCapturing()
                await mixer.startRunning()

                let factory = RTMPSessionFactory()
                let session = factory.make(url, mode: .publish, configuration: nil)

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
                    print("[Broadcast] RTMP connected")
                }

                // Save state
                BroadcastManager.shared.mixer = mixer
                BroadcastManager.shared.audioSourceService = audioSourceService
                BroadcastManager.shared.session = session
                BroadcastManager.shared.isRunning = true

                completion(nil)
            } catch {
                print("[Broadcast] start error: \(error)")
                await cleanup()
                completion(error as NSError)
            }
        }
    }

    @objc(stopWithCompletion:)
    public static func stop(completion: @escaping (NSError?) -> Void) {
        print("[Broadcast] stop called")
        guard BroadcastManager.shared.isRunning else {
            completion(nil)
            return
        }
        Task {
            do {
                if let session = BroadcastManager.shared.session {
                    try? await session.close()
                }
                if let mixer = BroadcastManager.shared.mixer {
                    await mixer.stopRunning()
                    await mixer.stopCapturing()
                    try? await mixer.attachAudio(nil)
                    try? await mixer.attachVideo(nil, track: 0)
                    if let session = BroadcastManager.shared.session {
                        await mixer.removeOutput(session.stream)
                    }
                }
                await cleanup()
                completion(nil)
            } catch {
                print("[Broadcast] stop error: \(error)")
                await cleanup()
                completion(error as NSError)
            }
        }
    }

    @objc(setCameraDirectionWithDirection:)
    public static func setCameraDirection(direction: String) {
        let position: AVCaptureDevice.Position = (direction.lowercased() == "back") ? .back : .front
        BroadcastManager.shared.cameraPosition = position
        guard let mixer = BroadcastManager.shared.mixer else { return }
        Task {
            let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
            try? await mixer.attachVideo(camera, track: 0) { unit in
                unit.isVideoMirrored = position == .front
            }
        }
    }

    @objc(setCameraEnabledWithEnabled:)
    public static func setCameraEnabled(enabled: Bool) {
        BroadcastManager.shared.cameraEnabled = enabled
        guard let mixer = BroadcastManager.shared.mixer else { return }
        Task {
            if enabled {
                let position = BroadcastManager.shared.cameraPosition
                let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
                try? await mixer.attachVideo(camera, track: 0) { unit in
                    unit.isVideoMirrored = position == .front
                }
            } else {
                try? await mixer.attachVideo(nil, track: 0)
            }
        }
    }

    @objc(setMicrophoneEnabledWithEnabled:)
    public static func setMicrophoneEnabled(enabled: Bool) {
        BroadcastManager.shared.micEnabled = enabled
        guard let mixer = BroadcastManager.shared.mixer else { return }
        Task {
            if enabled {
                let mic = AVCaptureDevice.default(for: .audio)
                try? await mixer.attachAudio(mic)
            } else {
                try? await mixer.attachAudio(nil)
            }
        }
    }

    // MARK: - Helpers
    @MainActor
    private static func cleanup() {
        BroadcastManager.shared.session = nil
        BroadcastManager.shared.mixer = nil
        BroadcastManager.shared.audioSourceService = nil
        BroadcastManager.shared.isRunning = false
    }
}

