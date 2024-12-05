//
//  DeviceState.swift
//  StreamVideoReactNative
//
//  Created by Kristian Martinoski on 3.12.24.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Foundation

@objc(DeviceState)
class DeviceState:RCTEventEmitter{

  private var hasListeners = false;
  override init(){
    super.init();
    UIDevice.current.isBatteryMonitoringEnabled = true;
  }

  @objc
  func isLowPowerModeEnabled(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(ProcessInfo.processInfo.isLowPowerModeEnabled);
  }

  @objc
  func currentThermalState(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(ProcessInfo.processInfo.thermalState.rawValue);
  }

  override func startObserving() {
    hasListeners = true;

    NotificationCenter.default.addObserver(self,
      selector: #selector(powerModeDidChange),
      name: NSNotification.Name.NSProcessInfoPowerStateDidChange, object: nil)

    NotificationCenter.default.addObserver(self,
      selector: #selector(thermalStateDidChange),
      name: ProcessInfo.thermalStateDidChangeNotification, object: nil)
}

  override func stopObserving() {
    hasListeners = false;

    NotificationCenter.default.removeObserver(self,
      name: NSNotification.Name.NSProcessInfoPowerStateDidChange, object: nil)
    
    NotificationCenter.default.removeObserver(self,
      name: NSNotification.Name.NSProcessInfoPowerStateDidChange, object: nil)
  }

  @objc func powerModeDidChange() {
    if(!hasListeners) {
      return;
    }
    let lowPowerEnabled = ProcessInfo.processInfo.isLowPowerModeEnabled;

    self.sendEvent(withName: "isLowPowerModeEnabled", body: lowPowerEnabled);
    
  }

  @objc func thermalStateDidChange() {
    if (!hasListeners) {
      return
    }
    let thermalState = ProcessInfo.processInfo.thermalState.rawValue
    self.sendEvent(withName: "thermalStateDidChange", body: thermalState)
  }

  override func supportedEvents() -> [String]! {
    return ["isLowPowerModeEnabled",  "thermalStateDidChange"];
  }

  override class func requiresMainQueueSetup() -> Bool {
    return false;
  }
  
}
