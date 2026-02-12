#import <Foundation/Foundation.h>
#import <CallKit/CallKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Callingx - React Native Turbo Module for CallKit integration
 *
 * This header exposes the public API for use in AppDelegate or other native code.
 *
 * Usage in AppDelegate.m:
 * ```
 * #import <Callingx/CallingxPublic.h>
 *
 * [Callingx reportNewIncomingCall:callId
 *                          handle:handle
 *                      handleType:@"number"
 *                        hasVideo:YES
 *             localizedCallerName:callerName
 *                 supportsHolding:NO
 *                    supportsDTMF:NO
 *                supportsGrouping:NO
 *              supportsUngrouping:NO
 *                     fromPushKit:YES
 *                         payload:payload
 *           withCompletionHandler:^(NSError *error){ }];
 * ```
 */
@interface Callingx : NSObject

/**
 * Report a new incoming call to CallKit.
 * Call this from your PushKit delegate when receiving a VoIP push notification.
 *
 * @param callId Unique identifier for the call (e.g., call ID from your backend)
 * @param handle The phone number or identifier to display
 * @param handleType Type of handle: "number", "email", or "generic"
 * @param hasVideo Whether this is a video call
 * @param localizedCallerName The caller's display name
 * @param supportsHolding Whether the call supports being put on hold
 * @param supportsDTMF Whether the call supports DTMF tones
 * @param supportsGrouping Whether the call can be grouped with other calls
 * @param supportsUngrouping Whether the call can be ungrouped
 * @param fromPushKit Whether this call is from a PushKit notification
 * @param payload Optional payload data from the push notification
 * @param completion Completion handler called after the call is reported, with an error if the call could not be displayed
 */
+ (void)reportNewIncomingCall:(NSString *)callId
                       handle:(NSString *)handle
                   handleType:(NSString *)handleType
                     hasVideo:(BOOL)hasVideo
          localizedCallerName:(NSString * _Nullable)localizedCallerName
              supportsHolding:(BOOL)supportsHolding
                 supportsDTMF:(BOOL)supportsDTMF
             supportsGrouping:(BOOL)supportsGrouping
           supportsUngrouping:(BOOL)supportsUngrouping
                  fromPushKit:(BOOL)fromPushKit
                      payload:(NSDictionary * _Nullable)payload
        withCompletionHandler:(void (^_Nullable)(NSError *_Nullable error))completion;

/**
 * End a call with a specific reason.
 *
 * @param callId The call ID to end
 * @param reason The reason for ending: 1=failed, 2=remoteEnded, 3=unanswered, 4=answeredElsewhere, 5=declinedElsewhere
 */
+ (void)endCall:(NSString *)callId
         reason:(int)reason;

/**
 * Check if a new call can be registered (based on shouldRejectCallWhenBusy setting)
 *
 * @return YES if a new call can be registered, NO if should be rejected
 */
+ (BOOL)canRegisterCall;

@end

NS_ASSUME_NONNULL_END
