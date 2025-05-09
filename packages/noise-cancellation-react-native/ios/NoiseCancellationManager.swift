import Foundation

// Ensure that StreamAudioFilterProcessingModule, NoiseCancellationFilter,
// NoiseCancellationProcessor, and AudioManager are accessible from this file.
// If they are part of a specific module, you might need to import it here.
// e.g., import YourAudioProcessingModule

class NoiseCancellationManager {
    // MARK: - Singleton Instance
    private static let _sharedInstance = NoiseCancellationManager()

    // Public static method to get the instance
    static func getInstance() -> NoiseCancellationManager {
        return _sharedInstance
    }

    // MARK: - Properties
    let processingModule = StreamAudioFilterProcessingModule()
    var noiseCancellationFilter: NoiseCancellationFilter!
    var noiseCancellationProcessor: NoiseCancellationProcessor!

    // Private initializer to enforce the singleton pattern
    private init() {}

    // MARK: - Processor Registration
    func registerProcessor() {
        // Initialize the noise cancellation processor and filter
        noiseCancellationProcessor = NoiseCancellationProcessor()
        noiseCancellationFilter = NoiseCancellationFilter(
            name: "noise-cancellation",
            initialize: noiseCancellationProcessor.initialize,
            process: noiseCancellationProcessor.process,
            release: noiseCancellationProcessor.release
        )

        // Set up the audio processing module with AudioManager
        AudioManager.sharedInstance().audioProcessingModule = processingModule
    }
} 