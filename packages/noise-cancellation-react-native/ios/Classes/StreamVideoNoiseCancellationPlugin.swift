import StreamVideoNoiseCancellation
import UIKit
import stream_webrtc_flutter

public class StreamVideoNoiseCancellationPlugin: NSObject, FlutterPlugin {
  public static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(
      name: "stream_video_noise_cancellation", binaryMessenger: registrar.messenger())
    let instance = StreamVideoNoiseCancellationPlugin()
    registrar.addMethodCallDelegate(instance, channel: channel)
  }

  let processingModule = StreamAudioFilterProcessingModule()
  var noiseCancellationFilter: NoiseCancellationFilter!
  var noiseCancellationProcessor: NoiseCancellationProcessor!

  public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "registerProcessor":
      noiseCancellationProcessor = NoiseCancellationProcessor()
      noiseCancellationFilter = NoiseCancellationFilter(
        name: "noise-cancellation",
        initialize: noiseCancellationProcessor.initialize,
        process: noiseCancellationProcessor.process,
        release: noiseCancellationProcessor.release)

      AudioManager.sharedInstance().audioProcessingModule = processingModule

      result(nil)
    case "isEnabled":
      result(processingModule.activeAudioFilter != nil)
    case "setEnabled":
      if noiseCancellationFilter == nil {
        result(
          FlutterError(
            code: "NOISE_CANCELLATION_FILTER_NOT_REGISTERED",
            message: "Noise cancellation filter not registered",
            details: nil)
        )
        return
      }

      if let arguments = call.arguments as? [String: Any] {
        guard let enabled = arguments["enabled"] as? Bool
        else {
          result(
            FlutterError(
              code: "INVALID_ARGUMENT", message: "Invalid argument", details: nil)
          )
          return
        }

        if enabled {
          processingModule.setAudioFilter(noiseCancellationFilter)
        } else {
          if processingModule.activeAudioFilter != nil {
            processingModule.setAudioFilter(nil)
          }
        }
      }

      result(nil)
    case "deviceSupportsAdvancedAudioProcessing":
      result(neuralEngineExists)
    default:
      result(FlutterMethodNotImplemented)
    }
  }
}
