import AVFoundation
import Foundation
import HaishinKit
import RTMPHaishinKit

@objc
public class BroadcastInstanceState: NSObject {
    var mixer: MediaMixer?
    var audioSourceService: AudioSourceService?
    var session: Session?

    var isRunning: Bool = false
    var cameraPosition: AVCaptureDevice.Position = .front
    var cameraEnabled: Bool = true
    var micEnabled: Bool = true

    override public init() {
        super.init()
    }

    @MainActor
    func reset() {
        session = nil
        mixer = nil
        audioSourceService = nil
        isRunning = false
        cameraPosition = .front
        cameraEnabled = true
        micEnabled = true
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
        let created = BroadcastInstanceState()
        states[instanceId] = created
        return created
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
