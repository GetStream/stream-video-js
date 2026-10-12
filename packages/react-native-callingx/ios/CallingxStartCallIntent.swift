// iOS 27 App Intents phone schema: Siri/Shortcuts start-call support and donation.
// The `.phone` schema only exists in the Xcode 27 SDK; older Xcode compiles this file empty.
#if compiler(>=6.4)
import AppIntents
import Foundation

@available(iOS 27.0, *)
@UnionValue
public enum CallingxDestination: Sendable {
    case person(CallingxPerson)
    case people([CallingxPerson])
}

@available(iOS 27.0, *)
@AppEnum(schema: .phone.audioVisualMode)
public enum CallingxAVMode: String {
    case audio, video

    public static let caseDisplayRepresentations: [Self: DisplayRepresentation] = [
        .audio: "Audio",
        .video: "Video",
    ]
}

/// A call participant; `id` is the user id used as the handle value.
@available(iOS 27.0, *)
@AppEntity(schema: .phone.phonePerson)
public struct CallingxPerson: Sendable {
    public static let defaultQuery = CallingxPersonQuery()

    public let id: String
    public var person: IntentPerson
    public var name: String

    public var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)")
    }

    public init(id: String, name: String? = nil) {
        let name = name?.isEmpty == false ? name! : id
        self.id = id
        self.name = name
        self.person = IntentPerson(
            identifier: .applicationDefined(id),
            name: .displayName(name),
            handle: IntentPerson.Handle(applicationDefined: id)
        )
    }
}

/// Union-case entities need an `EntityStringQuery`. Callingx keeps no contacts: ids map to themselves.
@available(iOS 27.0, *)
public struct CallingxPersonQuery: EntityStringQuery {
    public init() {}

    public func entities(for identifiers: [String]) async throws -> [CallingxPerson] {
        return identifiers.map { CallingxPerson(id: $0) }
    }

    public func entities(matching string: String) async throws -> [CallingxPerson] {
        let id = string.trimmingCharacters(in: .whitespacesAndNewlines)
        return id.isEmpty ? [] : [CallingxPerson(id: id)]
    }
}

@available(iOS 27.0, *)
@AppIntent(schema: .phone.startCall)
public struct CallingxStartCallIntent: AudioRecordingIntent {
    // JS creates and rings the call, so the app must come to the foreground.
    public static let supportedModes: IntentModes = .foreground

    public var destination: CallingxDestination
    public var audioVisualMode: CallingxAVMode

    public init() {}

    public func perform() async throws -> some IntentResult {
        let ids: [String]
        switch destination {
        case .person(let person): ids = [person.id]
        case .people(let people): ids = people.map { $0.id }
        }
        let handle = ids.filter { !$0.isEmpty }.sorted().joined(separator: ",")
        let isVideo = audioVisualMode == .video
        CallingxLog.core.debugPublic("[CallingxStartCallIntent] handle = \(handle) isVideo = \(isVideo)")
        if !handle.isEmpty {
            CallingxImpl.emitStartCallIntent(handle: handle, isVideo: isVideo)
        }
        return .result()
    }

    /// Donates the intent for an ended call (`handle`: comma-separated user ids). Fire-and-forget.
    static func donate(handle: String, displayName: String?, isVideo: Bool) {
        let ids = handle.split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        guard !ids.isEmpty else { return }

        let intent = CallingxStartCallIntent()
        if ids.count == 1 {
            intent.destination = .person(CallingxPerson(id: ids[0], name: displayName))
        } else {
            intent.destination = .people(ids.map { CallingxPerson(id: $0) })
        }
        intent.audioVisualMode = isVideo ? .video : .audio

        Task.detached {
            do {
                _ = try await IntentDonationManager.shared.donate(intent: intent)
                CallingxLog.core.debugPublic("[CallingxStartCallIntent] donated handle = \(handle)")
            } catch {
                CallingxLog.core.errorPublic("[CallingxStartCallIntent] donation failed: \(error)")
            }
        }
    }
}

/// Include in the app's own `AppIntentsPackage.includedPackages` to expose the intent.
@available(iOS 27.0, *)
public struct CallingxIntentsPackage: AppIntentsPackage {}
#endif
