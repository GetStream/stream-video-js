#import "CallingxPublic.h"

// Compiled without modules, so the Swift header's @imports are skipped; import its dependencies first.
#import <React/RCTBridgeModule.h>

#if __has_include("Callingx-Swift.h")
#import "Callingx-Swift.h"
#else
#import <Callingx/Callingx-Swift.h>
#endif

@interface Callingx ()

// Returns the persisted `skipIncomingPushInForeground` setting.
// Called by VoipPushHandler; not part of the public CallingxPublic.h API.
+ (BOOL)shouldSkipIncomingPushInForeground;

@end

@implementation Callingx

+ (void)reportNewIncomingCall:(NSString *)callId
                       handle:(NSString *)handle
                   handleType:(NSString *)handleType
                     hasVideo:(BOOL)hasVideo
          localizedCallerName:(NSString *_Nullable)localizedCallerName
              supportsHolding:(BOOL)supportsHolding
                 supportsDTMF:(BOOL)supportsDTMF
             supportsGrouping:(BOOL)supportsGrouping
           supportsUngrouping:(BOOL)supportsUngrouping
                      payload:(NSDictionary *_Nullable)payload
        withCompletionHandler:(void (^_Nullable)(void))completion {

  [CallingxImpl reportNewIncomingCallWithCallId:callId
                                         handle:handle
                                     handleType:handleType
                                       hasVideo:hasVideo
                            localizedCallerName:localizedCallerName
                                supportsHolding:supportsHolding
                                   supportsDTMF:supportsDTMF
                               supportsGrouping:supportsGrouping
                             supportsUngrouping:supportsUngrouping
                                        payload:payload
                                     completion:completion
                                        resolve:nil
                                         reject:nil
  ];
}

+ (BOOL)canRegisterCall {
  return [CallingxImpl canRegisterCall];
}

+ (BOOL)shouldSkipIncomingPushInForeground {
  return [Settings getSkipIncomingPushInForeground];
}

+ (void)endCall:(NSString *)callId reason:(int)reason {
  [CallingxImpl endCall:callId reason:reason];
}

@end
