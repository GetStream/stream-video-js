#import <React/RCTEventEmitter.h>
#import <React/RCTBridge.h>
#import <PushKit/PushKit.h>

@interface StreamVideoReactNative : RCTEventEmitter <RCTBridgeModule>

- (void)screenShareEventReceived:(NSString *)event;

+ (void)didReceiveIncomingPush:(PKPushPayload *)payload completionHandler: (void (^_Nullable)(void)) completion;

+ (void)setup DEPRECATED_MSG_ATTRIBUTE("No need to use setup() anymore");

+ (BOOL)shouldRejectCallWhenBusy;

+ (BOOL)hasAnyActiveCall;

@end
