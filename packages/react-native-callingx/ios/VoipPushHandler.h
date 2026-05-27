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
 * callback. `metadata` is typed `id` so this header compiles on Xcode older
 * than the iOS 26.4 SDK; `mustReport` is read via runtime selector dispatch.
 */
+ (void)handleIncomingVoIPPush:(PKPushPayload *)payload
                      metadata:(id _Nullable)metadata
             completionHandler:(void (^_Nullable)(void))completion;

@end

NS_ASSUME_NONNULL_END
