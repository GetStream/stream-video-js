import Foundation
import React
import UIKit

// Do not change these consts, it is what is used react-native-webrtc
private let kBroadcastStartedNotification: CFNotificationName = CFNotificationName(rawValue: "iOS_BroadcastStarted" as CFString)
private let kBroadcastStoppedNotification: CFNotificationName = CFNotificationName(rawValue: "iOS_BroadcastStopped" as CFString)

@objc(StreamVideoReactNative)
class StreamVideoReactNative: RCTEventEmitter {
    
    private var hasListeners = false
    private let notificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
    private var audioUtils: AudioUtils

    private static var incomingCallUUIDsByCallID: [String: String] = [:]
    private static var incomingCallCidsByUUID: [String: String] = [:]
    private static let dictionaryQueue = DispatchQueue(label: "com.stream.video.dictionary", attributes: .concurrent)

    override init() {
        audioUtils = AudioUtils()
        super.init()
        UIDevice.current.isBatteryMonitoringEnabled = true
        setupObserver()
    }
    
    deinit {
        clearObserver()
        NotificationCenter.default.removeObserver(self)
    }
    
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc
    @available(*, deprecated, message: "No need to use setup() anymore")
    static func setup() {
        // let videoEncoderFactory = RTCDefaultVideoEncoderFactory()
        // let simulcastVideoEncoderFactory = RTCVideoEncoderFactorySimulcast(primary: videoEncoderFactory, fallback: videoEncoderFactory)
        // if let options = WebRTCModuleOptions.sharedInstance() {
        //     options.videoEncoderFactory = simulcastVideoEncoderFactory
        // }
    }
    
    private func setupObserver() {
        let observer = Unmanaged.passUnretained(self).toOpaque()
        
        let callback: @convention(c) (CFNotificationCenter?, UnsafeMutableRawPointer?, CFNotificationName?, UnsafeRawPointer?, CFDictionary?) -> Void = { (center, observer, name, object, userInfo) in
            guard let observer = observer else { return }
            let mySelf = Unmanaged<StreamVideoReactNative>.fromOpaque(observer).takeUnretainedValue()
            if let cfName = name {
                let eventName = cfName.rawValue as String
                mySelf.screenShareEventReceived(event: eventName)
            }
        }
        
        CFNotificationCenterAddObserver(notificationCenter,
                                        observer,
                                        callback,
                                        kBroadcastStartedNotification.rawValue,
                                        nil,
                                        .deliverImmediately)
        
        CFNotificationCenterAddObserver(notificationCenter,
                                        observer,
                                        callback,
                                        kBroadcastStoppedNotification.rawValue,
                                        nil,
                                        .deliverImmediately)
    }
    
    private func clearObserver() {
        let observer = Unmanaged.passUnretained(self).toOpaque()
        CFNotificationCenterRemoveObserver(notificationCenter, observer, kBroadcastStartedNotification, nil)
        CFNotificationCenterRemoveObserver(notificationCenter, observer, kBroadcastStoppedNotification, nil)
    }

    @objc(isLowPowerModeEnabled:rejecter:)
    func isLowPowerModeEnabled(resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(ProcessInfo.processInfo.isLowPowerModeEnabled)
    }
    
    @objc(currentThermalState:rejecter:)
    func currentThermalState(resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let thermalState = ProcessInfo.processInfo.thermalState
        resolve(stringForThermalState(thermalState))
    }
    
    override func startObserving() {
        hasListeners = true
        NotificationCenter.default.addObserver(self, selector: #selector(powerModeDidChange), name: Notification.Name.NSProcessInfoPowerStateDidChange, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(thermalStateDidChange), name: ProcessInfo.thermalStateDidChangeNotification, object: nil)
    }
    
    override func stopObserving() {
        hasListeners = false
        // deinit will handle removal of observers
    }
    
    @objc private func powerModeDidChange() {
        guard hasListeners else { return }
        let lowPowerEnabled = ProcessInfo.processInfo.isLowPowerModeEnabled
        sendEvent(withName: "isLowPowerModeEnabled", body: lowPowerEnabled)
    }
    
    @objc private func thermalStateDidChange() {
        guard hasListeners else { return }
        let thermalState = ProcessInfo.processInfo.thermalState
        let thermalStateString = stringForThermalState(thermalState)
        sendEvent(withName: "thermalStateDidChange", body: thermalStateString)
    }
    
    private func stringForThermalState(_ thermalState: ProcessInfo.ThermalState) -> String {
        switch thermalState {
        case .nominal:
            return "NOMINAL"
        case .fair:
            return "FAIR"
        case .serious:
            return "SERIOUS"
        case .critical:
            return "CRITICAL"
        @unknown default:
            return "UNSPECIFIED"
        }
    }

    func screenShareEventReceived(event: String) {
        if hasListeners {
            sendEvent(withName: "StreamVideoReactNative_Ios_Screenshare_Event", body: ["name": event])
        }
    }
    
    @objc
    static func registerIncomingCall(cid: String, uuid: String) {
        dictionaryQueue.async(flags: .barrier) {
            #if DEBUG
            print("registerIncomingCall cid:\(cid) -> uuid:\(uuid)")
            #endif
            let lowercaseUUID = uuid.lowercased()
            incomingCallUUIDsByCallID[cid] = lowercaseUUID
            incomingCallCidsByUUID[lowercaseUUID] = cid
        }
    }
    
    @objc
    func showAudioRoutePicker() {
        self.audioUtils.showAudioRoutePicker()
    }

    @objc(getIncomingCallUUid:resolver:rejecter:)
    func getIncomingCallUUid(cid: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        StreamVideoReactNative.dictionaryQueue.sync {
            if let uuid = StreamVideoReactNative.incomingCallUUIDsByCallID[cid] {
                resolve(uuid)
            } else {
                let errorString = "requested incoming call not found for cid: \(cid)"
                reject("access_failure", errorString, nil)
            }
        }
    }
    
    @objc(getIncomingCallCid:resolver:rejecter:)
    func getIncomingCallCid(uuid: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        StreamVideoReactNative.dictionaryQueue.sync {
            let lowercaseUUID = uuid.lowercased()
            if let foundCid = StreamVideoReactNative.incomingCallCidsByUUID[lowercaseUUID] {
                resolve(foundCid)
            } else {
                let errorString = "requested incoming call not found for uuid: \(uuid)"
                reject("access_failure", errorString, nil)
            }
        }
    }
    
    @objc(removeIncomingCall:resolver:rejecter:)
    func removeIncomingCall(cid: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        StreamVideoReactNative.dictionaryQueue.async(flags: .barrier) {
            if let uuid = StreamVideoReactNative.incomingCallUUIDsByCallID[cid] {
                #if DEBUG
                print("removeIncomingCall cid:\(cid) -> uuid:\(uuid)")
                #endif
                StreamVideoReactNative.incomingCallUUIDsByCallID.removeValue(forKey: cid)
                StreamVideoReactNative.incomingCallCidsByUUID.removeValue(forKey: uuid)
                resolve(true)
            } else {
                resolve(false)
            }
        }
    }
    
    @objc(captureRef:options:resolver:rejecter:)
    func captureRef(reactTag: NSNumber, options: [String: Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { uiManager, viewRegistry in
            guard let view = viewRegistry?[reactTag] else {
                reject("VIEW_NOT_FOUND", "No view found with reactTag: \(reactTag)", nil)
                return
            }
            
            let format = (options["format"] as? String)?.lowercased() ?? "png"
            let quality = (options["quality"] as? CGFloat) ?? 1.0
            let width = options["width"] as? CGFloat
            let height = options["height"] as? CGFloat
            
            let size: CGSize
            let bounds = view.bounds
            if let width = width, let height = height {
                size = CGSize(width: width, height: height)
            } else {
                size = bounds.size
            }
            
            guard size.width > 0, size.height > 0 else {
                reject("INVALID_SIZE", "View has invalid size", nil)
                return
            }
            
            UIGraphicsBeginImageContextWithOptions(size, false, 0)
            
            var drawRect = bounds
            if let width = width, let height = height {
                let scaleX = size.width / bounds.size.width
                let scaleY = size.height / bounds.size.height
                
                if let context = UIGraphicsGetCurrentContext() {
                    context.translateBy(x: 0, y: size.height)
                    context.scaleBy(x: scaleX, y: -scaleY)
                    drawRect = CGRect(x: 0, y: 0, width: bounds.size.width, height: bounds.size.height)
                }
            }
            
            let success = view.drawHierarchy(in: drawRect, afterScreenUpdates: true)
            
            let image = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()
            
            guard success, let capturedImage = image else {
                reject("CAPTURE_FAILED", "Failed to capture view as image", nil)
                return
            }
            
            let base64: String?
            if format == "jpg" || format == "jpeg" {
                base64 = capturedImage.jpegData(compressionQuality: quality)?.base64EncodedString()
            } else {
                base64 = capturedImage.pngData()?.base64EncodedString()
            }
            
            if let base64String = base64 {
                resolve(base64String)
            } else {
                reject("ENCODING_FAILED", "Failed to encode image to base64", nil)
            }
        }
    }

    @objc
    override func supportedEvents() -> [String]! {
        return ["StreamVideoReactNative_Ios_Screenshare_Event", "isLowPowerModeEnabled", "thermalStateDidChange"]
    }
} 
