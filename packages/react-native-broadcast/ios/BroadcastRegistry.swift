import AVFoundation
import Foundation
import HaishinKit
import RTMPHaishinKit

@objc
public class BroadcastInstanceState: NSObject {
    // Identifier for correlating events with JS instances
    var instanceId: String = ""

    var suppressEvents: Bool = false

    var mixer: MediaMixer?
    var audioSourceService: AudioSourceService?
    var session: Session?

    var isRunning: Bool = false {
        didSet {
            guard !suppressEvents else { return }
            BroadcastEventEmitter.emit("broadcast.started", body: [
                "instanceId": instanceId,
                "running": isRunning
            ])
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

    private func emitMediaStateUpdated() {
        guard !suppressEvents else { return }
        let direction = cameraPosition == .back ? "back" : "front"
        BroadcastEventEmitter.emit("broadcast.mediaStateUpdated", body: [
            "instanceId": instanceId,
            "cameraEnabled": cameraEnabled,
            "microphoneEnabled": micEnabled,
            "cameraDirection": direction
        ])
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
        emitMediaStateUpdated();
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
