//
//  BroadcastInstanceState.swift
//
//  Created by Oliver Lazoroski on 23.10.25.
//
import HaishinKit
import AVFoundation

@objc
public class BroadcastInstanceState: NSObject {
    // Identifier for correlating events with JS instances
    var instanceId: String = ""

    var suppressEvents: Bool = false

    var preset: BroadcastPreset = BroadcastPreset()

    var mixer: MediaMixer?
    var audioSourceService: AudioSourceService?
    var session: Session?

    var isRunning: Bool = false {
        didSet {
            guard !suppressEvents else { return }
            BroadcastEventEmitter.emit(
                "broadcast.started",
                body: [
                    "instanceId": instanceId,
                    "running": isRunning,
                ]
            )
        }
    }

    var cameraPosition: AVCaptureDevice.Position = .front {
        didSet {
            emitMediaStateUpdated()
        }
    }
    var cameraEnabled: Bool = true {
        didSet {
            emitMediaStateUpdated()
        }
    }
    var micEnabled: Bool = true {
        didSet {
            emitMediaStateUpdated()
        }
    }

    override public init() {
        super.init()
    }

    func withPreset(preset: BroadcastPreset) {
        self.preset = preset
    }

    private func emitMediaStateUpdated() {
        guard !suppressEvents else { return }
        let direction = cameraPosition == .back ? "back" : "front"
        BroadcastEventEmitter.emit(
            "broadcast.mediaStateUpdated",
            body: [
                "instanceId": instanceId,
                "cameraEnabled": cameraEnabled,
                "microphoneEnabled": micEnabled,
                "cameraDirection": direction,
            ]
        )
    }

    @MainActor
    func reset() {
        suppressEvents = true

        session = nil
        mixer = nil
        audioSourceService = nil
        isRunning = false
        cameraPosition = .front
        cameraEnabled = true
        micEnabled = true

        // send an update
        suppressEvents = false
        emitMediaStateUpdated()
    }
}
