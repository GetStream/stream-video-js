#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Callingx - React Native Turbo Module for system call UI integration (CallKit or LiveCommunicationKit on iOS)
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
 *                         payload:payload
 *           withCompletionHandler:^(void){ }];
 * ```
 */
@interface Callingx : NSObject

/**
 * Report a new incoming call to the system (CallKit, or LiveCommunicationKit when opted in).
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
 * @param payload Optional payload data from the push notification
 * @param completion PushKit completion handler. Called once the report has been started (the report itself finishes asynchronously).
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
                      payload:(NSDictionary * _Nullable)payload
        withCompletionHandler:(void (^_Nullable)(void))completion;

/**
 * End a call with a specific reason.
 *
 * @param callId The call ID to end
 * @param reason The reason for ending, mapped to the backend's end reason (`CXCallEndedReason` / `Conversation.EndedReason`):
 *               1=failed, 2=remoteEnded, 3=unanswered, 4=answeredElsewhere (joinedElsewhere), 5=declinedElsewhere.
 *               Unknown values map to failed.
 */
+ (void)endCall:(NSString *)callId
         reason:(int)reason;

/**
 * Check if a new call can be registered (based on shouldRejectCallWhenBusy setting)
 *
 * @return YES if a new call can be registered, NO if should be rejected
 */
+ (BOOL)canRegisterCall;

/**
 * Check if any call is active (joining, joined or paused) on the device, including calls of other apps.
 * Returns NO when the conversation manager has not been created yet.
 *
 * @return YES if there is an active call
 */
+ (BOOL)hasAnyActiveCall;

@end

NS_ASSUME_NONNULL_END
