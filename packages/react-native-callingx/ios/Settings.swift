import Foundation
import CallKit
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

    /// Wiped with UserDefaults on uninstall, so a reinstall doesn't register PushKit at
    /// launch for a token still bound to a previous user.
    public static func getVoipTokenRegistered() -> Bool {
        guard let registered = getSettings()["voipTokenRegistered"] as? Bool else {
            return false
        }
        return registered
    }

    public static func setVoipTokenRegistered(_ registered: Bool) {
        setSettings(["voipTokenRegistered": registered])
    }

    public static func migrateVoipTokenRegisteredIfNeeded() {
        let settings = getSettings()
        guard settings["voipTokenRegistered"] == nil, !settings.isEmpty else { return }
        CallingxLog.settings.debugPublic("[migrateVoipTokenRegisteredIfNeeded] legacy install, marking VoIP token as registered")
        setVoipTokenRegistered(true)
    }

    public static func initVoipTokenRegisteredIfNeeded() {
        guard getSettings()["voipTokenRegistered"] == nil else { return }
        setVoipTokenRegistered(false)
    }

    public static func getSkipIncomingPushInForeground() -> Bool {
        guard let skip = getSettings()["skipIncomingPushInForeground"] as? Bool else {
            return false
        }
        return skip
    }

    /// `true` when the integrator opted into LiveCommunicationKit. Read once per process by
    /// `CallingxImpl.currentBackend()`.
    public static func getUseLiveCommunicationKit() -> Bool {
        guard let useLiveCommunicationKit = getSettings()["useLiveCommunicationKit"] as? Bool else {
            return false
        }
        return useLiveCommunicationKit
    }

    // MARK: - CallKit

    /// `@nonobjc` keeps CallKit types out of the ObjC header (the `.m`/`.mm` files don't import CallKit).
    @nonobjc public static func getProviderConfiguration() -> CXProviderConfiguration {
        CallingxLog.settings.debugPublic("[getProviderConfiguration]")

        let settings = getSettings()
        let providerConfiguration = CXProviderConfiguration()
        providerConfiguration.supportsVideo = true
        providerConfiguration.maximumCallGroups = 1
        providerConfiguration.maximumCallsPerCallGroup = 1
        providerConfiguration.supportedHandleTypes = getSupportedHandleTypes(settings["handleType"])

        if let supportsVideo = settings["supportsVideo"] as? Bool {
            providerConfiguration.supportsVideo = supportsVideo
        }
        if let maximumCallGroups = settings["maximumCallGroups"] as? Int {
            providerConfiguration.maximumCallGroups = maximumCallGroups
        }
        if let maximumCallsPerCallGroup = settings["maximumCallsPerCallGroup"] as? Int {
            providerConfiguration.maximumCallsPerCallGroup = maximumCallsPerCallGroup
        }

        if let imageName = settings["imageName"] as? String, !imageName.isEmpty {
            if let image = UIImage(named: imageName) {
                providerConfiguration.iconTemplateImageData = image.pngData()
            }
        }

        if let ringtoneSound = settings["ringtoneSound"] as? String, !ringtoneSound.isEmpty {
            providerConfiguration.ringtoneSound = ringtoneSound
        }

        if let includesCallsInRecents = settings["includesCallsInRecents"] as? Bool {
            providerConfiguration.includesCallsInRecents = includesCallsInRecents
        }

        return providerConfiguration
    }

    @nonobjc public static func getSupportedHandleTypes(_ handleType: Any?) -> Set<CXHandle.HandleType> {
        if let handleTypeArray = handleType as? [String] {
            var types = Set<CXHandle.HandleType>()
            for type in handleTypeArray {
                types.insert(getHandleType(type))
            }
            return types
        } else if let handleTypeString = handleType as? String {
            let type: CXHandle.HandleType = getHandleType(handleTypeString)
            return Set([type])
        } else {
            return Set([CXHandle.HandleType.phoneNumber])
        }
    }

    @nonobjc public static func getHandleType(_ handleType: String?) -> CXHandle.HandleType {
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

    // MARK: - LiveCommunicationKit

    /// LCK types have no ObjC representation, hence `@nonobjc` on the members below. LCK is
    /// weak-linked (iOS 17.4+), hence `@available`.
    @available(iOS 17.4, *)
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

    @available(iOS 17.4, *)
    @nonobjc public static func getSupportedHandleTypes(_ handleType: Any?) -> Set<Handle.Kind> {
        if let handleTypeArray = handleType as? [String] {
            var types = Set<Handle.Kind>()
            for type in handleTypeArray {
                types.insert(getHandleType(type))
            }
            return types
        } else if let handleTypeString = handleType as? String {
            let type: Handle.Kind = getHandleType(handleTypeString)
            return Set([type])
        } else {
            return Set([Handle.Kind.phoneNumber])
        }
    }

    @available(iOS 17.4, *)
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
