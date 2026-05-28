#import <React/RCTEventEmitter.h>
#import <React/RCTBridge.h>
#import <PushKit/PushKit.h>

@interface StreamVideoReactNative : RCTEventEmitter <RCTBridgeModule>

- (void)screenShareEventReceived:(NSString *)event;

+ (void)setup DEPRECATED_MSG_ATTRIBUTE("No need to use setup() anymore");

+ (BOOL)hasAnyActiveCall;

+ (void)voipRegistration;

+ (void)didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(NSString *)type;

+ (void)didReceiveIncomingPush:(PKPushPayload *)payload forType:(NSString *)type completionHandler: (void (^_Nullable)(void)) completion;

/**
 * VoIP push entry point for iOS 26.4+. Call from your AppDelegate's
 * `pushRegistry:didReceiveIncomingVoIPPushWithPayload:metadata:withCompletionHandler:`
 * delegate. The SDK reads `mustReport` from `metadata` internally and decides
 * whether to show CallKit and/or forward the push to JS based on the
 * configured options.
 *
 * `metadata` is typed `id` (not `PKVoIPPushMetadata *`) so the call site
 * compiles on Xcode older than the iOS 26.4 SDK.
 */
+ (void)didReceiveIncomingVoIPPush:(PKPushPayload *)payload
                          metadata:(id _Nullable)metadata
                 completionHandler:(void (^_Nullable)(void))completion;

@end
