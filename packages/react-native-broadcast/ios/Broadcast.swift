import AVFoundation
import Foundation
import HaishinKit
import RTMPHaishinKit

@objc
public class BroadcastManager: NSObject {
    @objc public static let shared = BroadcastManager()

    var mixer: MediaMixer?
    var audioSourceService: AudioSourceService?

    private override init() {
        super.init()
    }
}

@objc
public class BroadcastSwift: NSObject {

    @objc
    public static func multiply(_ a: Double, b: Double, completion: @escaping (NSNumber?, NSError?) -> Void) {
        let uri = "rtmps://ingress.stream-io-video.com:443/par8f5s3gn2j.default.RdcC9Qr4j7pzr62FZbo8Q/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL2phbmUiLCJ1c2VyX2lkIjoiamFuZSIsInZhbGlkaXR5X2luX3NlY29uZHMiOjYwNDgwMCwiZW52aXJvbm1lbnQiOiJwcm9udG8iLCJpYXQiOjE3NjA5Njc0MzMsImV4cCI6MTc2MTU3MjIzM30.pkBwlOMlo7wUJG4DSG7fk8QAxF912Y5UaErm4H6a59I"

        print("[RTMP] Broadcast starting")

        Task {
            do {
                let audioSourceService = AudioSourceService()
                await audioSourceService.setUp()

                print("[RTMP] Audio source created")

                let mixer = MediaMixer(captureSessionMode: .single)
                await mixer.configuration { session in
                    session.automaticallyConfiguresApplicationAudioSession = false
                    session.sessionPreset = .hd1280x720
                }
                await mixer.setMonitoringEnabled(true)

                var videoMixerSettings = await mixer.videoMixerSettings
                videoMixerSettings.mode = .offscreen
                await mixer.setVideoMixerSettings(videoMixerSettings)

                // Store in manager for video view access
                BroadcastManager.shared.mixer = mixer
                BroadcastManager.shared.audioSourceService = audioSourceService

                print("[RTMP] Mixer created")

                let front = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
                try? await mixer.attachVideo(front, track: 0) { unit in unit.isVideoMirrored = true }

                let mic = AVCaptureDevice.default(for: .audio)
                try? await mixer.attachAudio(mic)

                await mixer.startCapturing()
                await mixer.startRunning()

                print("[RTMP] Mixer running")

                let factory = RTMPSessionFactory.init()
                let session = factory.make(URL(string: uri)!, mode: .publish, configuration: nil)

                print("[RTMP] Session created")

                await mixer.addOutput(session.stream)

                var audioSettings = await session.stream.audioSettings
                audioSettings.format = .aac
                audioSettings.bitRate = 48000
                try await session.stream.setAudioSettings(audioSettings)

                var videoSettings = await session.stream.videoSettings
                videoSettings.isLowLatencyRateControlEnabled = false
                videoSettings.bitRateMode = .average
                videoSettings.bitRate = 2500000
                videoSettings.videoSize = CGSize(width: 720, height: 1280)
                try await session.stream.setVideoSettings(videoSettings)

                print("[RTMP] Session connecting")
                try await session.connect {
                    print("[RTMP] Session connected")
                }

                completion(NSNumber(value: a * b), nil)
            } catch {
                print("[RTMP] error", error)
                completion(nil, error as NSError)
            }
        }
    }
}

