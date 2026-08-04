//
//  SampleHandler.swift
//  Broadcast Extension
//

import ReplayKit
import OSLog

let broadcastLogger = OSLog(subsystem: "io.getstream.reactnative", category: "Broadcast")
private enum Constants {
    // the App Group ID value that the app and the broadcast extension targets are setup with. It differs for each app.
    static let appGroupIdentifier = "group.com.example.broadcast.appgroup"
    static let videoSocketName = "rtc_SSFD"
    static let audioSocketName = "rtc_SSFD_audio"
    static let audioConnectMaxAttempts = 300
}
class SampleHandler: RPBroadcastSampleHandler {

    private var videoClientConnection: SocketConnection?
    private var videoUploader: SampleUploader?

    private var audioClientConnection: SocketConnection?
    private var audioUploader: AudioUploader?

    private var frameCount: Int = 0

    private func socketFilePath(for name: String) -> String {
        let sharedContainer = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: Constants.appGroupIdentifier)
        return sharedContainer?.appendingPathComponent(name).path ?? ""
    }

    var socketFilePath: String {
        socketFilePath(for: Constants.videoSocketName)
    }

    var audioSocketFilePath: String {
        socketFilePath(for: Constants.audioSocketName)
    }

    override init() {
      super.init()
        if let connection = SocketConnection(filePath: socketFilePath) {
          videoClientConnection = connection
          setupVideoConnection()

          videoUploader = SampleUploader(connection: connection)
        }

        if let connection = SocketConnection(filePath: audioSocketFilePath) {
          audioClientConnection = connection
          setupAudioConnection()

          audioUploader = AudioUploader(connection: connection)
        }
        os_log(.debug, log: broadcastLogger, "%{public}s", socketFilePath)
    }

    override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
        // User has requested to start the broadcast. Setup info from the UI extension can be supplied but optional.
        frameCount = 0

        DarwinNotificationCenter.shared.postNotification(.broadcastStarted)
        openVideoConnection()
        openAudioConnection()
    }

    override func broadcastPaused() {
        // User has requested to pause the broadcast. Samples will stop being delivered.
    }

    override func broadcastResumed() {
        // User has requested to resume the broadcast. Samples delivery will resume.
    }

    override func broadcastFinished() {
        // User has requested to finish the broadcast.
        DarwinNotificationCenter.shared.postNotification(.broadcastStopped)
        videoClientConnection?.close()
        audioClientConnection?.close()
    }

    override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
        switch sampleBufferType {
        case RPSampleBufferType.video:
            videoUploader?.send(sample: sampleBuffer)
        case RPSampleBufferType.audioApp:
            audioUploader?.send(sample: sampleBuffer)
        default:
            // .audioMic is handled by the app's audio device module; ignore it here.
            break
        }
    }
}

private extension SampleHandler {

    func setupVideoConnection() {
        videoClientConnection?.didClose = { [weak self] error in
            os_log(.debug, log: broadcastLogger, "client connection did close \(String(describing: error))")

            if let error = error {
                self?.finishBroadcastWithError(error)
            } else {
                // the displayed failure message is more user friendly when using NSError instead of Error
                let JMScreenSharingStopped = 10001
                let customError = NSError(domain: RPRecordingErrorDomain, code: JMScreenSharingStopped, userInfo: [NSLocalizedDescriptionKey: "Screen sharing stopped"])
                self?.finishBroadcastWithError(customError)
            }
        }
    }

    func setupAudioConnection() {
        // closed audio socket must not tear down the whole broadcast.
        audioClientConnection?.didClose = { error in
            os_log(.debug, log: broadcastLogger, "audio connection did close \(String(describing: error))")
        }
    }

    func openVideoConnection() {
        let queue = DispatchQueue(label: "broadcast.connectTimer")
        let timer = DispatchSource.makeTimerSource(queue: queue)
        timer.schedule(deadline: .now(), repeating: .milliseconds(100), leeway: .milliseconds(500))
        timer.setEventHandler { [weak self] in
            guard self?.videoClientConnection?.open() == true else {
                return
            }

            timer.cancel()
        }

        timer.resume()
    }

    func openAudioConnection() {
        let queue = DispatchQueue(label: "broadcast.audioConnectTimer")
        let timer = DispatchSource.makeTimerSource(queue: queue)
        timer.schedule(deadline: .now(), repeating: .milliseconds(100), leeway: .milliseconds(500))
        var attempts = 0
        timer.setEventHandler { [weak self] in
            attempts += 1
            if self?.audioClientConnection?.open() == true {
                timer.cancel()
                return
            }
            if attempts >= Constants.audioConnectMaxAttempts {
                timer.cancel()
            }
        }

        timer.resume()
    }
}
