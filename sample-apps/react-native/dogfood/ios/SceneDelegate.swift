//
//  SceneDelegate.swift
//  StreamReactNativeVideoSDKSample
//
import UIKit
import React

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    // Merge a cold-start deep link URL into launchOptions so that
    // RCTLinkingManager.getInitialURL() keeps working under the scene lifecycle.
    var launchOptions = appDelegate.launchOptions ?? [:]
    if let urlContext = connectionOptions.urlContexts.first {
      launchOptions[.url] = urlContext.url
    }

    let window = UIWindow(windowScene: windowScene)
    factory.startReactNative(
      withModuleName: "StreamReactNativeVideoSDKSample",
      in: window,
      launchOptions: launchOptions
    )

    self.window = window
    // Keep the app delegate's window in sync for libraries that still
    // read UIApplication.shared.delegate.window.
    appDelegate.window = window

    // Cold-start universal links (Handoff / https links).
    for userActivity in connectionOptions.userActivities {
      RCTLinkingManager.application(UIApplication.shared, continue: userActivity) { _ in }
    }
  }

  // Deep links (custom URL schemes) while the app is running
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for urlContext in URLContexts {
      RCTLinkingManager.application(UIApplication.shared, open: urlContext.url, options: [:])
    }
  }

  // Universal links while the app is running
  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(UIApplication.shared, continue: userActivity) { _ in }
  }
}
