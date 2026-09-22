import Foundation
import StreamVideoNoiseCancellation

@objc(NoiseCancellationReactNativeImpl)
public final class NoiseCancellationReactNativeImpl: NSObject {

    @objc
    public func isEnabled() -> Bool {
        NoiseCancellationManager.getInstance().processingModule.activeAudioFilter != nil
    }

    /// Returns `false` when the noise cancellation filter has not been registered yet.
    @objc
    public func setEnabled(_ enabled: Bool) -> Bool {
        let manager = NoiseCancellationManager.getInstance()
        guard let filter = manager.noiseCancellationFilter else {
            return false
        }

        if enabled {
            manager.processingModule.setAudioFilter(filter)
        } else if manager.processingModule.activeAudioFilter != nil {
            manager.processingModule.setAudioFilter(nil)
        }

        return true
    }

    @objc
    public func deviceSupportsAdvancedAudioProcessing() -> Bool {
        neuralEngineExists
    }
}
