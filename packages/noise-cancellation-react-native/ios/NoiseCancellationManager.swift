import Foundation
import StreamVideoNoiseCancellation
import stream_react_native_webrtc

@objcMembers
public final class NoiseCancellationManager: NSObject {
    // MARK: - Singleton Instance
    private static let _sharedInstance = NoiseCancellationManager()

    // Public static method to get the instance
    public static func getInstance() -> NoiseCancellationManager {
        return _sharedInstance
    }

    // MARK: - Properties
    public let processingModule = StreamAudioFilterProcessingModule()
    public var noiseCancellationFilter: NoiseCancellationFilter!
    public var noiseCancellationProcessor: NoiseCancellationProcessor!

    // Private initializer to enforce the singleton pattern
    private override init() {}

    // MARK: - Processor Registration
    public func registerProcessor() {
        // Initialize the noise cancellation processor and filter
        noiseCancellationProcessor = NoiseCancellationProcessor()
        noiseCancellationFilter = NoiseCancellationFilter(
            name: "noise-cancellation",
            initialize: noiseCancellationProcessor.initialize,
            process: noiseCancellationProcessor.process,
            release: noiseCancellationProcessor.release)
        
        AudioManager.sharedInstance().audioProcessingModule = processingModule

        // Set up the audio processing module with AudioManager
        let options = WebRTCModuleOptions.sharedInstance()
        
        options.audioProcessingModule = AudioManager.sharedInstance().audioProcessingModule
    }
} 
