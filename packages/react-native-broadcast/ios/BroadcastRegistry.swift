@objc
public class BroadcastRegistry: NSObject {
    @objc public static let shared = BroadcastRegistry()

    private var states: [String: BroadcastState] = [:]

    private override init() { super.init() }

    @objc
    public func state(for instanceId: String) -> BroadcastState {
        if let existing = states[instanceId] { return existing }
        let state = BroadcastState()
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
