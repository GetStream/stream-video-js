#import <Foundation/Foundation.h>
#import <PushKit/PushKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface VoipPushHandler : NSObject <PKPushRegistryDelegate>

+ (instancetype)sharedInstance;

/** Handles a legacy `pushRegistry:didReceiveIncomingPushWithPayload:forType:withCompletionHandler:` callback. */
+ (void)handleIncomingPush:(PKPushPayload *)payload
                   forType:(NSString *)type
         completionHandler:(void (^_Nullable)(void))completion;

/**
 * Handles an iOS 26.4+ `pushRegistry:didReceiveIncomingVoIPPushWithPayload:metadata:withCompletionHandler:`
 * callback. Gated behind `__IPHONE_26_4` because `PKVoIPPushMetadata` only
 * exists in the iOS 26.4 SDK; on older Xcode this declaration is omitted and
 * PushKit dispatches to the legacy `handleIncomingPush:forType:` path instead.
 */
#ifdef __IPHONE_26_4
+ (void)handleIncomingVoIPPush:(PKPushPayload *)payload
                      metadata:(PKVoIPPushMetadata * _Nullable)metadata
             completionHandler:(void (^_Nullable)(void))completion API_AVAILABLE(ios(26.4));
#endif

@end

NS_ASSUME_NONNULL_END
