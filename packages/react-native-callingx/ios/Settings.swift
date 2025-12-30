import Foundation
import CallKit
import UIKit

@objcMembers public class Settings: NSObject {
    private static let settingsKey = "CallingxSettings"

    public static func getSettings() -> [String: Any]? {
        return UserDefaults.standard.dictionary(forKey: settingsKey)
    }

    public static func setSettings(_ options: [String: Any]?) {
        #if DEBUG
        print("[Settings][setSettings] options = \(String(describing: options))")
        #endif

        var settings: [String: Any] = getSettings() ?? [:]

        if let options = options {
            for (key, value) in options {
                settings[key] = value
            }
        }

        UserDefaults.standard.set(settings, forKey: settingsKey)
        UserDefaults.standard.synchronize()
    }

    public static func getAutoConfigureAudioSession() -> Bool {
        guard let settings = getSettings(),
              let autoConfig = settings["autoConfigureAudioSession"] as? Bool else {
            return false
        }
        return autoConfig
    }

    public static func getShouldRejectCallWhenBusy() -> Bool {
        guard let settings = getSettings(),
              let shouldReject = settings["shouldRejectCallWhenBusy"] as? Bool else {
            return false
        }
        return shouldReject
    }

    public static func setShouldRejectCallWhenBusy(_ shouldReject: Bool) {
        setSettings(["shouldRejectCallWhenBusy": shouldReject])
    }

    public static func getProviderConfiguration(_ settings: [String: Any]) -> CXProviderConfiguration {
        #if DEBUG
        print("[Settings][getProviderConfiguration]")
        #endif

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

    public static func getSupportedHandleTypes(_ handleType: Any?) -> Set<CXHandle.HandleType> {
        if let handleTypeArray = handleType as? [String] {
            var types = Set<CXHandle.HandleType>()
            for type in handleTypeArray {
                types.insert(getHandleType(type))
            }
            return types
        } else if let handleTypeString = handleType as? String {
            let type = getHandleType(handleTypeString)
            return Set([type])
        } else {
            return Set([CXHandle.HandleType.phoneNumber])
        }
    }

    public static func getHandleType(_ handleType: String?) -> CXHandle.HandleType {
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