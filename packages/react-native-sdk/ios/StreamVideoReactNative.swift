//
//  StreamVideoReactNative.swift
//  StreamVideoReactNative
//
//  Created by Kristian Martinoski on 4.12.24.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Foundation
import React

@objc(StreamVideoReactNative)
class StreamVideoReactNative: RCTEventEmitter {
    
    private var hasListeners: Bool = false
    private let notificationCenter: CFNotificationCenter = CFNotificationCenterGetDarwinNotifyCenter()
    private static var incomingCallDictionary: [String: String] = [:]
    
    // Do not change these consts, it is what is used react-native-webrtc
    static let broadcastStartedNotification: CFString = "iOS_BroadcastStarted" as CFString
    static let broadcastStoppedNotification: CFString = "iOS_BroadcastStopped" as CFString

    
    override init() {
        super.init()
        setupObserver()
        UIDevice.current.isBatteryMonitoringEnabled = true;
    }
    
    deinit {
        clearObserver()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc static func setup() {
        // let videoEncoderFactory = RTCDefaultVideoEncoderFactory()
        // let simulcastVideoEncoderFactory = RTCVideoEncoderFactorySimulcast(primary: videoEncoderFactory, fallback: videoEncoderFactory)
        // let options = WebRTCModuleOptions.sharedInstance()
        // options.videoEncoderFactory = simulcastVideoEncoderFactory
    }
    
    private func setupObserver() {
        hasListeners = true
    
        CFNotificationCenterAddObserver(notificationCenter,
                                        Unmanaged.passUnretained(self).toOpaque(),
                                        broadcastNotificationCallback,
                                        CFNotificationName(StreamVideoReactNative.broadcastStartedNotification as CFString),
                                        nil,
                                        .deliverImmediately)
        
        CFNotificationCenterAddObserver(notificationCenter,
                                        Unmanaged.passUnretained(self).toOpaque(),
                                        broadcastNotificationCallback,
                                        CFNotificationName(StreamVideoReactNative.broadcastStoppedNotification as CFString),
                                        nil,
                                        .deliverImmediately)
        
        NotificationCenter.default.addObserver(self,
        selector: #selector(powerModeDidChange),
        name: NSNotification.Name.NSProcessInfoPowerStateDidChange, object: nil)

        NotificationCenter.default.addObserver(self,
        selector: #selector(thermalStateDidChange),
        name: ProcessInfo.thermalStateDidChangeNotification, object: nil)
    }
    
    private func clearObserver() {
        hasListeners = false

        CFNotificationCenterRemoveObserver(notificationCenter,
                                           Unmanaged.passUnretained(self).toOpaque(),
                                           CFNotificationName(StreamVideoReactNative.broadcastStartedNotification as CFString),
                                           nil)
        
        CFNotificationCenterRemoveObserver(notificationCenter,
                                           Unmanaged.passUnretained(self).toOpaque(),
                                           CFNotificationName(StreamVideoReactNative.broadcastStoppedNotification as CFString),
                                           nil)
    
        NotificationCenter.default.removeObserver(self,
        name: NSNotification.Name.NSProcessInfoPowerStateDidChange, object: nil)
        
        NotificationCenter.default.removeObserver(self,
        name: ProcessInfo.thermalStateDidChangeNotification, object: nil)
    }
    
    override func supportedEvents() -> [String]! {
        return ["StreamVideoReactNative_Ios_Screenshare_Event", "powerModeChanged", "onThermalStatusChanged"]
    }
    
    func screenShareEventReceived(_ event: String) {
        if hasListeners {
            sendEvent(withName: "StreamVideoReactNative_Ios_Screenshare_Event", body: ["name": event])
        }
    }
    
    static func registerIncomingCall(cid: String, uuid: String) {
        incomingCallDictionary[cid] = uuid
    }
    
    @objc func getIncomingCallUuid(_ cid: String, resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
        guard let uuid = StreamVideoReactNative.incomingCallDictionary[cid] else {
            rejecter("access_failure", "requested incoming call not found", nil)
            return
        }
        resolver(uuid)
    }

    @objc
    func isLowPowerModeEnabled(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        resolve(ProcessInfo.processInfo.isLowPowerModeEnabled);
    }

    @objc
    func currentThermalState(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        resolve(ProcessInfo.processInfo.thermalState.rawValue);
    }

    @objc func powerModeDidChange() {
        if(!hasListeners) {
            return;
        }
        let lowPowerEnabled = ProcessInfo.processInfo.isLowPowerModeEnabled;

        self.sendEvent(withName: "powerModeChanged", body: lowPowerEnabled);
    }

    @objc func thermalStateDidChange() {
        if (!hasListeners) {
            return
        }
        let thermalState = ProcessInfo.processInfo.thermalState.rawValue
        self.sendEvent(withName: "onThermalStatusChanged", body: thermalState)
    }
}

private func broadcastNotificationCallback(_ center: CFNotificationCenter?,
                                           _ observer: UnsafeMutableRawPointer?,
                                           _ name: CFString?,
                                           _ object: UnsafeRawPointer?,
                                           _ userInfo: CFDictionary?) {
    guard let observer = observer,
          let name = name as String? else { return }
    
    let this = Unmanaged<StreamVideoReactNative>.fromOpaque(observer).takeUnretainedValue()
    this.screenShareEventReceived(name)
}
