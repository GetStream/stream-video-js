import Foundation
import LiveCommunicationKit
import UIKit

@objcMembers public class Settings: NSObject {
    private static let settingsKey = "CallingxSettings"

    // In-memory cache of the settings dictionary
    private static var cachedSettings: [String: Any]?
    private static let cacheQueue = DispatchQueue(label: "io.getstream.callingx.settings")

    public static func getSettings() -> [String: Any] {
        return cacheQueue.sync {
            if let cached = cachedSettings {
                return cached
            }
            cachedSettings = UserDefaults.standard.dictionary(forKey: settingsKey) ?? [:]
            return cachedSettings!
        }
    }

    public static func setSettings(_ options: [String: Any]?) {
        CallingxLog.settings.debugPublic("[setSettings] options = \(String(describing: options))")

        cacheQueue.sync {
            // Load lazily here rather than via getSettings() to avoid re-entrant sync on cacheQueue.
            var settings = cachedSettings ?? UserDefaults.standard.dictionary(forKey: settingsKey) ?? [:]

            if let options = options {
                for (key, value) in options {
                    settings[key] = value
                }
            }

            cachedSettings = settings
            UserDefaults.standard.set(settings, forKey: settingsKey)
        }
    }

    public static func getShouldRejectCallWhenBusy() -> Bool {
        guard let shouldReject = getSettings()["shouldRejectCallWhenBusy"] as? Bool else {
            return false
        }
        return shouldReject
    }

    public static func setShouldRejectCallWhenBusy(_ shouldReject: Bool) {
        setSettings(["shouldRejectCallWhenBusy": shouldReject])
    }

    public static func getSkipIncomingPushInForeground() -> Bool {
        guard let skip = getSettings()["skipIncomingPushInForeground"] as? Bool else {
            return false
        }
        return skip
    }

    /// LCK types have no ObjC representation, hence `@nonobjc` on the members below.
    @nonobjc public static func getConversationManagerConfiguration() -> ConversationManager.Configuration {
        CallingxLog.settings.debugPublic("[getConversationManagerConfiguration]")

        let settings = getSettings()
        var configuration = ConversationManager.Configuration(
            ringtoneName: nil,
            iconTemplateImageData: nil,
            maximumConversationGroups: 1,
            maximumConversationsPerConversationGroup: 1,
            includesConversationInRecents: false,
            supportsVideo: true,
            supportedHandleTypes: getSupportedHandleTypes(settings["handleType"])
        )

        if let supportsVideo = settings["supportsVideo"] as? Bool {
            configuration.supportsVideo = supportsVideo
        }
        if let maximumCallGroups = settings["maximumCallGroups"] as? Int {
            configuration.maximumConversationGroups = maximumCallGroups
        }
        if let maximumCallsPerCallGroup = settings["maximumCallsPerCallGroup"] as? Int {
            configuration.maximumConversationsPerConversationGroup = maximumCallsPerCallGroup
        }

        if let imageName = settings["imageName"] as? String, !imageName.isEmpty {
            if let image = UIImage(named: imageName) {
                configuration.iconTemplateImageData = image.pngData()
            }
        }

        if let ringtoneSound = settings["ringtoneSound"] as? String, !ringtoneSound.isEmpty {
            configuration.ringtoneName = ringtoneSound
        }

        if let includesCallsInRecents = settings["includesCallsInRecents"] as? Bool {
            configuration.includesConversationInRecents = includesCallsInRecents
        }

        return configuration
    }

    @nonobjc public static func getSupportedHandleTypes(_ handleType: Any?) -> Set<Handle.Kind> {
        if let handleTypeArray = handleType as? [String] {
            var types = Set<Handle.Kind>()
            for type in handleTypeArray {
                types.insert(getHandleType(type))
            }
            return types
        } else if let handleTypeString = handleType as? String {
            let type = getHandleType(handleTypeString)
            return Set([type])
        } else {
            return Set([Handle.Kind.phoneNumber])
        }
    }

    @nonobjc public static func getHandleType(_ handleType: String?) -> Handle.Kind {
        guard let handleType = handleType else { return .generic }

        switch handleType {
        case "generic":
            return .generic
        case "number", "phone":
            return .phoneNumber
        case "email":
            return .emailAddress
        default:
            return .generic
        }
    }
}
