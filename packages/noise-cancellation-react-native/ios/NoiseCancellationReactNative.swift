import StreamVideoNoiseCancellation

@objc(NoiseCancellationReactNative)
class NoiseCancellationReactNative: NSObject {
    
    @objc(registerProcessor:withRejecter:)
    func registerProcessor(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        // Delegate the processor registration logic to the singleton using getInstance()
        NoiseCancellationManager.getInstance().registerProcessor()
        resolve(true)
    }
    
    @objc(isEnabled:withRejecter:)
    func isEnabled(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        resolve(NoiseCancellationManager.getInstance().processingModule.activeAudioFilter != nil)
    }
    
    @objc(setEnabled:withResolver:withRejecter:)
    func setEnabled(enabled: Bool, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        if NoiseCancellationManager.getInstance().noiseCancellationFilter == nil {
            reject(
                "NOISE_CANCELLATION_FILTER_NOT_REGISTERED",
                "Noise cancellation filter not registered"
            )
            return
        }
        
        if enabled {
            NoiseCancellationManager.getInstance().processingModule.setAudioFilter(NoiseCancellationManager.shared.noiseCancellationFilter)
        } else {
            if NoiseCancellationManager.getInstance().processingModule.activeAudioFilter != nil {
                NoiseCancellationManager.getInstance().processingModule.setAudioFilter(nil)
            }
        }
        
        
        resolve(true)
    }
    
    @objc(deviceSupportsAdvancedAudioProcessing:withRejecter:)
    func deviceSupportsAdvancedAudioProcessing(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        resolve(neuralEngineExists)
    }
}
