//
//  AppDelegate.swift
//  StreamReactNativeVideoSDKSample
//
//  Created by santhosh vaiyapuri on 03/03/2025.
//
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications
import RNCPushNotificationIOS
import React

import RNCallKeep
import PushKit
import WebRTC
import RNVoipPushNotification

@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate, PKPushRegistryDelegate {

  override func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    return RCTLinkingManager.application(application, open: url, options: options)
  }

  // Required for the register event.
  override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }

  // Required for the notification event. You must call the completion handler after handling the remote notification.
  override func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: completionHandler)
  }

  // Required for the registrationError event.
  override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    RNCPushNotificationIOS.didFailToRegisterForRemoteNotificationsWithError(error)
  }

  // Required for localNotification event
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    RNCPushNotificationIOS.didReceive(response)
  }

  override func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }

  // --- Handle updated push credentials
  func pushRegistry(
      _ registry: PKPushRegistry,
      didUpdate credentials: PKPushCredentials,
      for type: PKPushType
  ) {
    RNVoipPushNotificationManager.didUpdate(credentials, forType: type.rawValue)
  }

  // --- Handle incoming pushes
  func pushRegistry(
      _ registry: PKPushRegistry,
      didReceiveIncomingPushWith payload: PKPushPayload,
      for type: PKPushType,
      completion: @escaping () -> Void
  ) {

    guard let stream = payload.dictionaryPayload["stream"] as? [String: Any],
          let createdCallerName = stream["created_by_display_name"] as? String,
          let cid = stream["call_cid"] as? String else {
      completion() // Ensure completion handler is called even if parsing fails
      return
    }

    let uuid = UUID().uuidString

    StreamVideoReactNative.registerIncomingCall(cid, uuid: uuid)

    // required if you want to call `completion()` on the js side
    RNVoipPushNotificationManager.addCompletionHandler(uuid, completionHandler: completion)

    // Process the received push // fire 'notification' event to JS
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue) // type is enum, use rawValue

    RNCallKeep.reportNewIncomingCall(uuid,
                                       handle: createdCallerName,
                                       handleType: "generic",
                                       hasVideo: true,
                                       localizedCallerName: createdCallerName,
                                       supportsHolding: true,
                                       supportsDTMF: true,
                                       supportsGrouping: true,
                                       supportsUngrouping: true,
                                       fromPushKit: true,
                                       payload: stream,
                                       withCompletionHandler: nil) // Completion handler is already handled above
  }

  //Called when a notification is delivered to a foreground app.
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.sound, .alert, .badge]) // Use array literal for options
  }

  func provider(_ provider: CXProvider, didActivateAudioSession audioSession: AVAudioSession) {
    RTCAudioSession.sharedInstance().audioSessionDidActivate(AVAudioSession.sharedInstance()) // Use sharedInstance()
  }

  func provider(_ provider: CXProvider, didDeactivateAudioSession audioSession: AVAudioSession) {
    RTCAudioSession.sharedInstance().audioSessionDidDeactivate(AVAudioSession.sharedInstance()) // Use sharedInstance()
  }
  
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    let localizedAppName = Bundle.main.localizedInfoDictionary?["CFBundleDisplayName"] as? String
    let appName = Bundle.main.infoDictionary?["CFBundleDisplayName"] as? String
    RNCallKeep.setup([
      "appName": localizedAppName != nil ? localizedAppName! : appName as Any, // Forced unwrap is safe here due to nil check
      "supportsVideo": true,
      "includesCallsInRecents": false,
    ])

    RNVoipPushNotificationManager.voipRegistration()
    
    self.moduleName = "StreamReactNativeVideoSDKSample"
    self.dependencyProvider = RCTAppDependencyProvider()

    let center = UNUserNotificationCenter.current()
    center.delegate = self

    let options = WebRTCModuleOptions.sharedInstance()
    options.enableMultitaskingCameraAccess = true
    //  uncomment below to see native webrtc logs
    //  options.loggingSeverity = .info // Use enum value directly

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }
 
  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
