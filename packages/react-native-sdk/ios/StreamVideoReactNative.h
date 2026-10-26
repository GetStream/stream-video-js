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
 * Handles a call back from a CallKit Recents entry: emits the callingx `callBackRequested`
 * event. Requires `push.ios.callsHistory`. Call it with every user activity the app receives:
 * `application:continueUserActivity:restorationHandler:`, and with the UIScene lifecycle also
 * `scene:willConnectToSession:options:` (cold start) and `scene:continueUserActivity:`.
 *
 * @return YES if the activity was a call back and was handled, NO otherwise.
 */
+ (BOOL)handleUserActivity:(NSUserActivity *)userActivity;

@end
