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
import WebRTC
import RNCPushNotificationIOS
import stream_io_noise_cancellation_react_native
import stream_video_react_native

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  // Kept for the SceneDelegate, which starts React Native when the scene connects.
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?

  // Forward device token to push-notification-ios
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
  }


  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    RNCPushNotificationIOS.didFailToRegisterForRemoteNotificationsWithError(error)
  }
  
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    // All other remote notifications: show natively
    completionHandler([.sound, .alert, .badge])
  }

  // Forward notification tap to push-notification-ios
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    RNCPushNotificationIOS.didReceive(response)
    completionHandler()
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    StreamVideoReactNative.voipRegistration()
    
    let center = UNUserNotificationCenter.current()
    center.delegate = self
    
    NoiseCancellationManager.getInstance().registerProcessor()
    
    let options = WebRTCModuleOptions.sharedInstance()
    options.enableMultitaskingCameraAccess = true
    #if DEBUG
    // Native WebRTC logs (debug-only), use `.verbose` to log everything
    options.loggingSeverity = .warning
    #endif

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // The window and React Native root view are created by the SceneDelegate
    // when the window scene connects (UIScene lifecycle, required by iOS 26+ SDKs).
    self.launchOptions = launchOptions

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
