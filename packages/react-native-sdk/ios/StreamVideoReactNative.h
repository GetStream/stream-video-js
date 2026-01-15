#import <React/RCTEventEmitter.h>
#import <React/RCTBridge.h>
#import <PushKit/PushKit.h>

@interface StreamVideoReactNative : RCTEventEmitter <RCTBridgeModule>

- (void)screenShareEventReceived:(NSString *)event;

+ (void)setup DEPRECATED_MSG_ATTRIBUTE("No need to use setup() anymore");

+ (BOOL)rejectIncomingCallIfNeeded:(void (^_Nullable)(void)) completion;

+ (BOOL)hasAnyActiveCall;

+ (void)voipRegistration;

+ (void)didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(NSString *)type;

+ (void)didReceiveIncomingPush:(PKPushPayload *)payload forType:(NSString *)type completionHandler: (void (^_Nullable)(void)) completion;

@end
