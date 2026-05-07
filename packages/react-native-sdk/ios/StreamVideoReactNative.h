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
 * delegate. Read `mustReport` with `+readMustReportFromMetadata:`.
 */
+ (void)didReceiveIncomingVoIPPush:(PKPushPayload *)payload
                        mustReport:(BOOL)mustReport
                 completionHandler:(void (^_Nullable)(void))completion;

/**
 * Reads `mustReport` from a `PKVoIPPushMetadata` object. `metadata` is typed
 * `id` so the call site compiles on Xcode older than the iOS 26.4 SDK.
 * Returns `YES` on any failure so unknown metadata never skips CallKit.
 */
+ (BOOL)readMustReportFromMetadata:(id _Nullable)metadata;

@end
