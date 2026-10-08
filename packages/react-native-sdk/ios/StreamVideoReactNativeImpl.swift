import Foundation
import UIKit
import AVFoundation
import React
import stream_react_native_webrtc

/// Implemented by the `StreamVideoReactNativeModule` TurboModule adapter, which forwards
/// to the codegen `emitOn*` emitters.
@objc public protocol StreamVideoReactNativeEventEmitter: AnyObject {
    func emitScreenShareEvent(_ payload: [String: Any])
    func emitLowPowerModeChanged(_ enabled: Bool)
    func emitThermalStateChanged(_ state: String)
    func emitChargingStateChanged(_ payload: [String: Any])
}

// Do not change these consts, it is what is used react-native-webrtc
private let kBroadcastStartedNotification = "iOS_BroadcastStarted"
private let kBroadcastStoppedNotification = "iOS_BroadcastStopped"

private let broadcastNotificationCallback: CFNotificationCallback = { _, observer, name, _, _ in
    guard let observer, let name else { return }
    let this = Unmanaged<StreamVideoReactNativeImpl>.fromOpaque(observer).takeUnretainedValue()
    this.eventEmitter?.emitScreenShareEvent(["name": name.rawValue as String])
}

@objc public class StreamVideoReactNativeImpl: NSObject {

    /// The TurboModule adapter; events are dropped when it is gone.
    @objc public weak var eventEmitter: StreamVideoReactNativeEventEmitter?
    /// The view registry is assigned to the adapter after init, so it is resolved lazily.
    @objc public var viewRegistryProvider: (() -> RCTViewRegistry?)?

    private let notificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
    private var hasScreenshareObserver = false
    private var hasDeviceStateObservers = false

    @objc public override init() {
        super.init()
        UIDevice.current.isBatteryMonitoringEnabled = true
        setupScreenshareEventObserver()
        setupDeviceStateObservers()
    }

    deinit {
        clearScreenshareEventObserver()
        NotificationCenter.default.removeObserver(self)
    }

    @objc public func invalidate() {
        clearScreenshareEventObserver()
        clearDeviceStateObservers()
    }

    // MARK: - Screen share (Darwin broadcast notifications)

    private func setupScreenshareEventObserver() {
        guard !hasScreenshareObserver else { return }
        hasScreenshareObserver = true
        let observer = Unmanaged.passUnretained(self).toOpaque()
        for name in [kBroadcastStartedNotification, kBroadcastStoppedNotification] {
            CFNotificationCenterAddObserver(
                notificationCenter,
                observer,
                broadcastNotificationCallback,
                name as CFString,
                nil,
                .deliverImmediately
            )
        }
    }

    private func clearScreenshareEventObserver() {
        guard hasScreenshareObserver else { return }
        hasScreenshareObserver = false
        let observer = Unmanaged.passUnretained(self).toOpaque()
        for name in [kBroadcastStartedNotification, kBroadcastStoppedNotification] {
            CFNotificationCenterRemoveObserver(
                notificationCenter,
                observer,
                CFNotificationName(name as CFString),
                nil
            )
        }
    }

    // MARK: - Device state

    // Emits are dropped by the adapter until JS has set the event emitter callback.
    private func setupDeviceStateObservers() {
        guard !hasDeviceStateObservers else { return }
        hasDeviceStateObservers = true
        let center = NotificationCenter.default
        center.addObserver(
            self,
            selector: #selector(powerModeDidChange),
            name: .NSProcessInfoPowerStateDidChange,
            object: nil
        )
        center.addObserver(
            self,
            selector: #selector(thermalStateDidChange),
            name: ProcessInfo.thermalStateDidChangeNotification,
            object: nil
        )
        center.addObserver(
            self,
            selector: #selector(batteryStateDidChange),
            name: UIDevice.batteryStateDidChangeNotification,
            object: nil
        )
    }

    private func clearDeviceStateObservers() {
        guard hasDeviceStateObservers else { return }
        hasDeviceStateObservers = false
        let center = NotificationCenter.default
        center.removeObserver(self, name: .NSProcessInfoPowerStateDidChange, object: nil)
        center.removeObserver(self, name: ProcessInfo.thermalStateDidChangeNotification, object: nil)
        center.removeObserver(self, name: UIDevice.batteryStateDidChangeNotification, object: nil)
    }

    @objc private func powerModeDidChange() {
        eventEmitter?.emitLowPowerModeChanged(ProcessInfo.processInfo.isLowPowerModeEnabled)
    }

    @objc private func thermalStateDidChange() {
        eventEmitter?.emitThermalStateChanged(currentThermalState())
    }

    @objc private func batteryStateDidChange() {
        eventEmitter?.emitChargingStateChanged(getBatteryState())
    }

    @objc public func isLowPowerModeEnabled() -> Bool {
        return ProcessInfo.processInfo.isLowPowerModeEnabled
    }

    @objc public func currentThermalState() -> String {
        switch ProcessInfo.processInfo.thermalState {
        case .nominal: return "NOMINAL"
        case .fair: return "FAIR"
        case .serious: return "SERIOUS"
        case .critical: return "CRITICAL"
        @unknown default: return "UNSPECIFIED"
        }
    }

    @objc public func getBatteryState() -> [String: Any] {
        let state = UIDevice.current.batteryState
        let isCharging = state == .charging || state == .full
        return [
            "charging": isCharging,
            "level": (UIDevice.current.batteryLevel * 100).rounded(),
        ]
    }

    // MARK: - Permissions

    @objc(checkPermission:resolve:reject:)
    public func checkPermission(
        _ permission: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        let mediaType: AVMediaType
        switch permission.lowercased() {
        case "camera": mediaType = .video
        case "microphone": mediaType = .audio
        default:
            reject("UNSUPPORTED_MEDIA_DEVICE_KIND", "Unsupported media device kind: \(permission)", nil)
            return
        }
        resolve(AVCaptureDevice.authorizationStatus(for: mediaType) == .authorized)
    }

    // MARK: - Screenshots

    @objc(captureRef:options:resolve:reject:)
    public func captureRef(
        _ reactTag: NSNumber,
        options: [String: Any],
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let registry = viewRegistryProvider?() else {
            reject("EUNSPECIFIED", "View registry is not available", nil)
            return
        }
        // It seems that due to how UIBlocks work with uiManager, we need to call the methods in UIManagerQueue
        // for the blocks to be dispatched before the batch is completed
        RCTGetUIManagerQueue().async {
            registry.addUIBlock { viewRegistry in
                guard let view = viewRegistry?.view(forReactTag: reactTag) else {
                    reject("EUNSPECIFIED", "No view found with reactTag: \(reactTag)", nil)
                    return
                }

                let format = (options["format"] as? String)?.lowercased() ?? "png"
                let quality = (options["quality"] as? NSNumber).map { CGFloat($0.floatValue) } ?? 1.0
                let width = options["width"] as? NSNumber
                let height = options["height"] as? NSNumber

                let bounds = view.bounds
                let size: CGSize
                if let width, let height {
                    size = CGSize(width: CGFloat(width.floatValue), height: CGFloat(height.floatValue))
                } else {
                    size = bounds.size
                }

                if size.width <= 0 || size.height <= 0 {
                    reject("INVALID_SIZE", "View has invalid size", nil)
                    return
                }

                UIGraphicsBeginImageContextWithOptions(size, false, 0)

                var drawRect = bounds
                if width != nil && height != nil {
                    let scaleX = size.width / bounds.size.width
                    let scaleY = size.height / bounds.size.height
                    // Apply transform to context for scaling if dimensions differ
                    if let context = UIGraphicsGetCurrentContext() {
                        context.translateBy(x: 0, y: size.height)
                        context.scaleBy(x: scaleX, y: -scaleY)
                        drawRect = CGRect(x: 0, y: 0, width: bounds.size.width, height: bounds.size.height)
                    }
                }

                let success = view.drawHierarchy(in: drawRect, afterScreenUpdates: true)
                let image = UIGraphicsGetImageFromCurrentImageContext()
                UIGraphicsEndImageContext()

                guard success, let image else {
                    reject("CAPTURE_FAILED", "Failed to capture view as image", nil)
                    return
                }

                let imageData: Data?
                if format == "jpg" || format == "jpeg" {
                    imageData = image.jpegData(compressionQuality: quality)
                } else {
                    imageData = image.pngData()
                }

                if let base64 = imageData?.base64EncodedString(options: .endLineWithCarriageReturn) {
                    resolve(base64)
                } else {
                    reject("ENCODING_FAILED", "Failed to encode image to base64", nil)
                }
            }
        }
    }
}
