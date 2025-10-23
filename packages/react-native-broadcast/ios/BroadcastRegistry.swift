import AVFoundation
import Foundation
import HaishinKit
import RTMPHaishinKit

@objcMembers
public class BroadcastPreset: NSObject {
    var width: Int = 720
    var height: Int = 1280
    var frameRate: Double = 30
    var videoBitrate: Int = 3_000_000
    var audioBitrate: Int = 128_000

    override init() { super.init() }

    @objc public init(
        width: Int,
        height: Int,
        frameRate: Double,
        videoBitrate: Int,
        audioBitrate: Int
    ) {
        self.width = width
        self.height = height
        self.frameRate = frameRate
        self.videoBitrate = videoBitrate
        self.audioBitrate = audioBitrate
        super.init()
    }
}

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

@objc
public class BroadcastRegistry: NSObject {
    @objc public static let shared = BroadcastRegistry()

    private var states: [String: BroadcastInstanceState] = [:]

    private override init() { super.init() }

    @objc
    public func state(for instanceId: String) -> BroadcastInstanceState {
        if let existing = states[instanceId] { return existing }
        let state = BroadcastInstanceState()
        state.instanceId = instanceId
        states[instanceId] = state
        return state
    }

    @objc
    public func remove(_ instanceId: String) {
        Task { @MainActor in
            if let state = states.removeValue(forKey: instanceId) {
                state.reset()
            }
        }
    }
}
