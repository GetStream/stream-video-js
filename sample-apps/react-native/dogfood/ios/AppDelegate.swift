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
import Callingx
import PushKit
import WebRTC
import RNVoipPushNotification
import stream_io_noise_cancellation_react_native
import stream_video_react_native

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, PKPushRegistryDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  
  func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    return RCTLinkingManager.application(application, open: url, options: options)
  }
  
  // Required for the register event.
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }
  
  // Required for the notification event. You must call the completion handler after handling the remote notification.
  func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: completionHandler)
  }
  
  // Required for the registrationError event.
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    RNCPushNotificationIOS.didFailToRegisterForRemoteNotificationsWithError(error)
  }
  
  // Required for localNotification event
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    RNCPushNotificationIOS.didReceive(response)
  }
  
  func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
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
     
    // Check if user is busy BEFORE registering the call
    let shouldReject = StreamVideoReactNative.shouldRejectCallWhenBusy()
    let hasAnyActiveCall = StreamVideoReactNative.hasAnyActiveCall()
        
    if shouldReject && hasAnyActiveCall {
        // Complete the VoIP notification without showing CallKit UI
        completion()
        return
    }
        
    // required if you want to call `completion()` on the js side
    RNVoipPushNotificationManager.addCompletionHandler(cid, completionHandler: completion)
    
    // Process the received push // fire 'notification' event to JS
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue) // type is enum, use rawValue
    
    StreamVideoReactNative.didReceiveIncomingPush(payload, completionHandler: nil) //for now left completion handler empty
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

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Uncomment the next line to enable verbose WebRTC logs
    // WebRTCModuleOptions.sharedInstance().loggingSeverity = .verbose
    
    RNVoipPushNotificationManager.voipRegistration()
    
    let center = UNUserNotificationCenter.current()
    center.delegate = self
    
    NoiseCancellationManager.getInstance().registerProcessor()
    
    let options = WebRTCModuleOptions.sharedInstance()
    options.enableMultitaskingCameraAccess = true
    //  uncomment below to see native webrtc logs
    //  options.loggingSeverity = .info // Use enum value directly

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "StreamReactNativeVideoSDKSample",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
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
