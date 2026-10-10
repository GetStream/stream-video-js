#import <Foundation/Foundation.h>

@interface StreamVideoReactNative : NSObject

+ (BOOL)hasAnyActiveCall;

/**
 * Registers for VoIP push notifications. The SDK owns the `PKPushRegistry` and
 * its delegate internally, so your `AppDelegate` does not need to conform to
 * `PKPushRegistryDelegate` or implement any `pushRegistry(...)` methods. Call
 * once from `application:didFinishLaunchingWithOptions:`.
 */
+ (void)voipRegistration;

/**
 * Forwards a user activity to callingx so a start-call intent (a tap on the app's
 * call in the Phone app's Recents) redials the call. Call it from your
 * SceneDelegate's `scene(_:continue:)` and for each `connectionOptions.userActivities`
 * on cold start (or from `application(_:continue:restorationHandler:)`).
 * Returns NO when callingx is not installed or the activity is not a start-call intent.
 */
+ (BOOL)handleUserActivity:(NSUserActivity *)userActivity NS_SWIFT_NAME(handleUserActivity(_:));

@end
