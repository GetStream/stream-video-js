#import <React/RCTEventEmitter.h>
#import <React/RCTBridge.h>

@interface StreamVideoReactNative : RCTEventEmitter <RCTBridgeModule>

- (void)screenShareEventReceived:(NSString *)event;

+ (void)registerIncomingCall:(NSString *)cid uuid:(NSString *)uuid;

+ (void)setup DEPRECATED_MSG_ATTRIBUTE("No need to use setup() anymore");

@end
