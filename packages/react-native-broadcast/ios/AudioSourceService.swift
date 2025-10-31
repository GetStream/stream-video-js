@preconcurrency import AVFoundation
import Combine

struct AudioSource: Sendable, Hashable, Equatable, CustomStringConvertible {
    static let empty = AudioSource(portName: "", dataSourceName: "", isSupportedStereo: false)

    let portName: String
    let dataSourceName: String
    let isSupportedStereo: Bool

    var description: String {
        if isSupportedStereo {
            return "\(portName)(\(dataSourceName))(Stereo)"
        }
        return "\(portName)(\(dataSourceName))(Mono)"
    }
}

actor AudioSourceService {
    enum Error: Swift.Error {
        case missingDataSource(_ source: AudioSource)
    }

    private(set) var sources: [AudioSource] = [] {
        didSet {
            guard sources != oldValue else {
                return
            }
            continuation?.yield(sources)
        }
    }
    private let session = AVAudioSession.sharedInstance()
    private var continuation: AsyncStream<[AudioSource]>.Continuation? {
        didSet {
            oldValue?.finish()
        }
    }

    init() {
        Task { await _init() }
    }

    private func _init() async {
        sources = makeAudioSources()
        Task {
            for await _ in NotificationCenter.default.notifications(named: AVAudioSession.routeChangeNotification)
                .compactMap({ $0.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt })
                .compactMap({ AVAudioSession.RouteChangeReason(rawValue: $0) }) {
                sources = makeAudioSources()
            }
        }
    }

    func setUp() {
        let session = AVAudioSession.sharedInstance()
        do {
            // If you set the "mode" parameter, stereo capture is not possible, so it is left unspecified.
            try session.setCategory(.playAndRecord, mode: .videoRecording, options: [.defaultToSpeaker, .allowBluetoothHFP])
            // It looks like this setting is required on iOS 18.5.
            try session.setPreferredInputNumberOfChannels(2)
            try session.setActive(true)
        } catch {
            print(error)
        }
    }

    func sourcesUpdates() -> AsyncStream<[AudioSource]> {
        AsyncStream { continuation in
            self.continuation = continuation
            continuation.yield(sources)
        }
    }

    func selectAudioSource(_ audioSource: AudioSource) throws {
        setPreferredInputBuiltInMic(true)
        guard let preferredInput = AVAudioSession.sharedInstance().preferredInput,
              let dataSources = preferredInput.dataSources,
              let newDataSource = dataSources.first(where: { $0.dataSourceName == audioSource.dataSourceName }),
              let supportedPolarPatterns = newDataSource.supportedPolarPatterns else {
            throw Error.missingDataSource(audioSource)
        }
        do {
            let isStereoSupported = supportedPolarPatterns.contains(.stereo)
            if isStereoSupported {
                try newDataSource.setPreferredPolarPattern(.stereo)
            }
            try preferredInput.setPreferredDataSource(newDataSource)
        } catch {
            print(error)
        }
    }

    private func makeAudioSources() -> [AudioSource] {
        if session.inputDataSources?.isEmpty == true {
            setPreferredInputBuiltInMic(false)
        } else {
            setPreferredInputBuiltInMic(true)
        }
        guard let preferredInput = session.preferredInput else {
            return []
        }
        var sources: [AudioSource] = []
        for dataSource in session.preferredInput?.dataSources ?? [] {
            sources.append(.init(
                portName: preferredInput.portName,
                dataSourceName: dataSource.dataSourceName,
                isSupportedStereo: dataSource.supportedPolarPatterns?.contains(.stereo) ?? false
            ))
        }
        return sources
    }

    private func setPreferredInputBuiltInMic(_ isEnabled: Bool) {
        do {
            if isEnabled {
                guard let availableInputs = session.availableInputs,
                      let builtInMicInput = availableInputs.first(where: { $0.portType == .builtInMic }) else {
                    return
                }
                try session.setPreferredInput(builtInMicInput)
            } else {
                try session.setPreferredInput(nil)
            }
        } catch {
            print(error)
        }
    }
}
