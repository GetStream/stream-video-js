#import "VoipPushHandler.h"
#import "CallingxPublic.h"
#import <UIKit/UIKit.h>

// Import Swift generated header for VoipNotificationsManager
#if __has_include("Callingx-Swift.h")
#import "Callingx-Swift.h"
#else
#import <Callingx/Callingx-Swift.h>
#endif

static NSString *const DEFAULT_DISPLAY_NAME = @"Unknown Caller";

@interface Callingx (VoipPushHandlerInternal)
+ (BOOL)shouldSkipIncomingPushInForeground;
@end

#pragma mark - Helpers

// applicationState must be read on the main thread (PushKit delivers on
// main, so the common path skips dispatch). Treat Inactive as foreground:
// covers brief transitions and system overlays.
static BOOL isAppInForeground(void) {
    __block UIApplicationState state = UIApplicationStateActive;
    void (^readState)(void) = ^{
        state = [UIApplication sharedApplication].applicationState;
    };
    if ([NSThread isMainThread]) {
        readState();
    } else {
        dispatch_sync(dispatch_get_main_queue(), readState);
    }
    return state != UIApplicationStateBackground;
}

// Extracts CallKit-display fields from the Stream payload and reports the
// incoming call via Callingx.
static void reportIncomingCallFromStreamPayload(NSDictionary *streamPayload,
                                                void (^_Nullable completion)(void)) {
    NSString *callCid = streamPayload[@"call_cid"];
    NSString *callDisplayName = streamPayload[@"call_display_name"];
    NSString *createdByDisplayName = streamPayload[@"created_by_display_name"];
    NSString *createdCallerName = callDisplayName.length > 0 ? callDisplayName : createdByDisplayName;
    NSString *localizedCallerName = createdCallerName.length > 0 ? createdCallerName : DEFAULT_DISPLAY_NAME;
    NSString *createdById = streamPayload[@"created_by_id"];
    NSString *handle = createdById.length > 0 ? createdById : localizedCallerName;
    NSString *videoIncluded = streamPayload[@"video"];
    BOOL hasVideo = [videoIncluded isEqualToString:@"false"] ? NO : YES;

    [Callingx reportNewIncomingCall:callCid
                             handle:handle
                         handleType:@"generic"
                           hasVideo:hasVideo
                localizedCallerName:localizedCallerName
                    supportsHolding:NO
                       supportsDTMF:NO
                   supportsGrouping:NO
                 supportsUngrouping:NO
                            payload:streamPayload
              withCompletionHandler:completion];
}

#pragma mark - Implementation

@implementation VoipPushHandler

+ (instancetype)sharedInstance {
    static VoipPushHandler *instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc] init];
    });
    return instance;
}

#pragma mark - Static orchestration

+ (void)handleIncomingPush:(PKPushPayload *)payload
                   forType:(NSString *)type
         completionHandler:(void (^_Nullable)(void))completion {
    NSDictionary *streamPayload = payload.dictionaryPayload[@"stream"];
    if (!streamPayload) {
        #if DEBUG
        NSLog(@"[VoipPushHandler][handleIncomingPush] Stream payload not found");
        #endif
        if (completion) {
            completion();
        }
        return;
    }

    NSString *callCid = streamPayload[@"call_cid"];
    if (!callCid) {
        #if DEBUG
        NSLog(@"[VoipPushHandler][handleIncomingPush] Missing required field: call_cid");
        #endif
        if (completion) {
            completion();
        }
        return;
    }

    if (![Callingx canRegisterCall]) {
        if (completion) {
            completion();
        }
        return;
    }

    reportIncomingCallFromStreamPayload(streamPayload, completion);
    [VoipNotificationsManager didReceiveIncomingPushWithPayload:payload forType:type];
}

#pragma mark - PKPushRegistryDelegate (managed mode)

- (void)pushRegistry:(PKPushRegistry *)registry
   didUpdatePushCredentials:(PKPushCredentials *)credentials
                    forType:(PKPushType)type {
    [VoipNotificationsManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

- (void)pushRegistry:(PKPushRegistry *)registry
   didReceiveIncomingPushWithPayload:(PKPushPayload *)payload
                             forType:(PKPushType)type
               withCompletionHandler:(void (^)(void))completion {
    [VoipPushHandler handleIncomingPush:payload
                                forType:(NSString *)type
                      completionHandler:completion];
    NSLog(@"[VoipPushHandler][pushRegistry:didReceiveIncomingPushWithPayload:forType:withCompletionHandler:] completion");
}

#ifdef __IPHONE_26_4
+ (void)handleIncomingVoIPPush:(PKPushPayload *)payload
                      metadata:(PKVoIPPushMetadata * _Nullable)metadata
             completionHandler:(void (^_Nullable)(void))completion {
    NSDictionary *streamPayload = payload.dictionaryPayload[@"stream"];
    if (!streamPayload) {
        #if DEBUG
        NSLog(@"[VoipPushHandler][handleIncomingVoIPPush] Stream payload not found");
        #endif
        if (completion) {
            completion();
        }
        return;
    }

    NSString *callCid = streamPayload[@"call_cid"];
    if (!callCid) {
        #if DEBUG
        NSLog(@"[VoipPushHandler][handleIncomingVoIPPush] Missing required field: call_cid");
        #endif
        if (completion) {
            completion();
        }
        return;
    }

    NSString *type = @"PKPushTypeVoIP";
    BOOL mustReport = metadata ? metadata.mustReport : YES;

    // Both skip paths require mustReport == NO; skipping while YES risks
    // PushKit terminating the app.
    if (!mustReport && ![Callingx canRegisterCall]) {
        // Busy reject: drop without forwarding to JS.
        if (completion) {
            completion();
        }
        return;
    }

    if (!mustReport &&
        [Callingx shouldSkipIncomingPushInForeground] &&
        isAppInForeground()) {
        // Foreground skip: hide CallKit, let JS render the ringing UI.
        [VoipNotificationsManager didReceiveIncomingPushWithPayload:payload forType:type];
        if (completion) {
            completion();
        }
        return;
    }

    reportIncomingCallFromStreamPayload(streamPayload, completion);
    [VoipNotificationsManager didReceiveIncomingPushWithPayload:payload forType:type];
}

// iOS 26.4 added a new VoIP push selector that carries a `PKVoIPPushMetadata`
// argument (notably `mustReport`). The type only exists in the iOS 26.4 SDK,
// so the `#ifdef __IPHONE_26_4` gate ensures this file still compiles on
// older Xcode versions — older Xcode simply doesn't emit this method, and
// PushKit on those builds dispatches to the legacy selector above.
- (void)pushRegistry:(PKPushRegistry *)registry
   didReceiveIncomingVoIPPushWithPayload:(PKPushPayload *)payload
                                metadata:(PKVoIPPushMetadata *)metadata
                   withCompletionHandler:(void (^)(void))completion
                                                                API_AVAILABLE(ios(26.4)) {
    [VoipPushHandler handleIncomingVoIPPush:payload
                                   metadata:metadata
                          completionHandler:completion];
    NSLog(@"[VoipPushHandler][pushRegistry:didReceiveIncomingVoIPPushWithPayload:metadata:withCompletionHandler:] completion");
}
#endif

@end
