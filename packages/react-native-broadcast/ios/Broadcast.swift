import AVFoundation
import Foundation
import HaishinKit
import RTMPHaishinKit

@objc
public class BroadcastSwift: NSObject {

    @objc
    public static func multiply(_ a: Double, b: Double, completion: @escaping (NSNumber?, NSError?) -> Void) {
        let uri = "rtmps://ingress.stream-io-video.com:443/par8f5s3gn2j.default.RdcC9Qr4j7pzr62FZbo8N/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL2phbmUiLCJ1c2VyX2lkIjoiamFuZSIsInZhbGlkaXR5X2luX3NlY29uZHMiOjYwNDgwMCwiZW52aXJvbm1lbnQiOiJwcm9udG8iLCJpYXQiOjE3NjA5NzM3OTcsImV4cCI6MTc2MTU3ODU5N30.SlaGVdXvSWiGFf_Bx8GcIekRj4H71hNPRQynJkR6P5c"

        print("RTMP begin publishing")

        Task {
            do {
                let audioSourceService = AudioSourceService()
                await audioSourceService.setUp()

                let mixer = MediaMixer(captureSessionMode: .single)
                await mixer.configuration { session in
                    session.automaticallyConfiguresApplicationAudioSession = false
                    session.sessionPreset = .hd1280x720
                }
                try? await mixer.configuration(video: 0) { video in
                    try? video.setFrameRate(30)
                }


                await mixer.setMonitoringEnabled(true)
                print("[RTMP] Mixer created")

                var videoMixerSettings = await mixer.videoMixerSettings
                videoMixerSettings.mode = .offscreen
                await mixer.setVideoMixerSettings(videoMixerSettings)

                await mixer.stopCapturing()

                let front = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
                try? await mixer.attachVideo(front) { unit in unit.isVideoMirrored = true }

                let mic = AVCaptureDevice.default(for: .audio)
                try? await mixer.attachAudio(mic);

                // Start capturing first, then running
                await mixer.startCapturing()
                await mixer.startRunning()

                print("[RTMP] Mixer configured")

                await SessionBuilderFactory.shared.register(RTMPSessionFactory())
                let session = try await SessionBuilderFactory.shared.make(URL(string: uri))
                    .setMode(.publish)
                    .build()
                guard let session else {
                    print("[RTMP] failed to create a session")
                    return completion(-1, nil)
                }

                print("[RTMP] session created")

                await mixer.addOutput(session.stream)

                var audioSettings = await session.stream.audioSettings
                audioSettings.format = .aac
                try await session.stream.setAudioSettings(audioSettings)

                var videoSettings = await session.stream.videoSettings
                videoSettings.isLowLatencyRateControlEnabled = false
                videoSettings.videoSize = CGSize(width: 720, height: 1280)
                try await session.stream.setVideoSettings(videoSettings)

                print("[RTMP] session connecting")
                try await session.connect {
                    print("[RTMP] session connected")
                }

                print("[RTMP] connection established successfully")
                completion(NSNumber(value: a * b), nil)
            } catch {
                print("[RTMP] error", error)
                completion(nil, error as NSError)
            }
        }
    }
}
