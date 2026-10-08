#import <Foundation/Foundation.h>

@interface StreamVideoReactNative : NSObject

+ (void)setup DEPRECATED_MSG_ATTRIBUTE("No need to use setup() anymore");

+ (BOOL)hasAnyActiveCall;

/**
 * Registers for VoIP push notifications. The SDK owns the `PKPushRegistry` and
 * its delegate internally, so your `AppDelegate` does not need to conform to
 * `PKPushRegistryDelegate` or implement any `pushRegistry(...)` methods. Call
 * once from `application:didFinishLaunchingWithOptions:`.
 */
+ (void)voipRegistration;

@end
