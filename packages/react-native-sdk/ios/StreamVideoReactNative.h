#import <React/RCTEventEmitter.h>

/// only the public methods exposed from module are to be written here

NS_ASSUME_NONNULL_BEGIN

@interface StreamVideoReactNative : RCTEventEmitter

/// @deprecated This method is no longer required and will be removed in a future version.
+ (void)setup DEPRECATED_MSG_ATTRIBUTE("No need to use setup() anymore");

/**
 * @brief Registers an incoming call with the system.
 * This is used to display the native incoming call UI on iOS.
 *
 * @param cid The Call ID of the incoming call.
 * @param uuid The UUID of the incoming call, which should be used for CallKit.
 */
+ (void)registerIncomingCall:(NSString *)cid uuid:(NSString *)uuid;

@end

NS_ASSUME_NONNULL_END
