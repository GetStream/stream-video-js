#import "Callingx.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTConvert.h>

#import <AVFoundation/AVAudioSession.h>
#import <CallKit/CallKit.h>
#import "UUIDStorage.h"
#import "Settings.h"
#import "AudioSessionManager.h"

#ifdef DEBUG
static int const OUTGOING_CALL_WAKEUP_DELAY = 10;
#else
static int const OUTGOING_CALL_WAKEUP_DELAY = 5;
#endif

static NSString *const CallingxDidReceiveStartCallAction = @"didReceiveStartCallAction";
static NSString *const CallingxPerformAnswerCallAction = @"answerCall";
static NSString *const CallingxPerformEndCallAction = @"endCall";
static NSString *const CallingxDidToggleHoldAction = @"didToggleHoldCallAction";
static NSString *const CallingxDidPerformSetMutedCallAction = @"didPerformSetMutedCallAction";
static NSString *const CallingxDidChangeAudioRoute = @"didChangeAudioRoute";
static NSString *const CallingxDidLoadWithEvents = @"didLoadWithEvents";
static NSString *const CallingxDidDisplayIncomingCall = @"didDisplayIncomingCall";

static NSString *const CallingxDidActivateAudioSession = @"didActivateAudioSession";
static NSString *const CallingxDidDeactivateAudioSession = @"didDeactivateAudioSession";
static NSString *const CallingxPerformPlayDTMFCallAction = @"didPerformDTMFAction";
static NSString *const CallingxProviderReset = @"providerReset";

@implementation Callingx {
  NSOperatingSystemVersion _version;
  bool _isSetup;
  bool _canSendEvents;
  bool _isSelfAnswered;
  bool _isSelfEnded;
  NSMutableArray *_delayedEvents;
}

static CXProvider *sharedProvider;
static UUIDStorage *uuidStorage;
static BOOL _shouldRejectCallWhenBusy = NO;

#pragma mark - Class Methods

+ (id)allocWithZone:(NSZone *)zone {
  static Callingx *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [super allocWithZone:zone];
});
  return sharedInstance;
}

+ (void)initUUIDStorage {
  if (uuidStorage == nil) {
    uuidStorage = [[UUIDStorage alloc] init];
    NSLog(@"[Callingx] initUUIDStorage");
  }
}

+ (void)initCallKitProvider {
  if (sharedProvider == nil) {
    NSDictionary *settings = [Settings getSettings];
    if (settings != nil) {
      sharedProvider = [[CXProvider alloc] initWithConfiguration:[Settings getProviderConfiguration:settings]];
      NSLog(@"[Callingx] initCallKitProvider");
    }
  }
}

+ (void)reportNewIncomingCall:(NSString *)callId
                       handle:(NSString *)handle
                   handleType:(NSString *)handleType
                     hasVideo:(BOOL)hasVideo
          localizedCallerName:(NSString *_Nullable)localizedCallerName
              supportsHolding:(BOOL)supportsHolding
                 supportsDTMF:(BOOL)supportsDTMF
             supportsGrouping:(BOOL)supportsGrouping
           supportsUngrouping:(BOOL)supportsUngrouping
                  fromPushKit:(BOOL)fromPushKit
                      payload:(NSDictionary *_Nullable)payload
        withCompletionHandler:(void (^_Nullable)(void))completion {
#ifdef DEBUG
  NSLog(@"[Callingx][reportNewIncomingCall] callId = %@", callId);
  NSLog(@"[Callingx][reportNewIncomingCall] handle = %@", handle);
  NSLog(@"[Callingx][reportNewIncomingCall] localizedCallerName = %@", localizedCallerName);
#endif

  [Callingx initUUIDStorage];
  [Callingx initCallKitProvider];

  if ([uuidStorage containsCid:callId]) {
    NSLog(@"[Callingx][reportNewIncomingCall] callId already exists");
    return;
  }

  CXHandleType _handleType = [Settings getHandleType:handleType];
  NSUUID *uuid = [uuidStorage getOrCreateUUIDForCid:callId];
  CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
  callUpdate.remoteHandle = [[CXHandle alloc] initWithType:_handleType value:handle];
  callUpdate.supportsHolding = supportsHolding;
  callUpdate.supportsDTMF = supportsDTMF;
  callUpdate.supportsGrouping = supportsGrouping;
  callUpdate.supportsUngrouping = supportsUngrouping;
  callUpdate.hasVideo = hasVideo;
  callUpdate.localizedCallerName = localizedCallerName;

  [sharedProvider reportNewIncomingCallWithUUID:uuid update:callUpdate completion:^(NSError *_Nullable error) {
    NSLog(@"[Callingx][reportNewIncomingCall] callId = %@, error = %@", callId, error);
    Callingx *callKeep = [Callingx allocWithZone:nil];
    [callKeep sendEventWithNameWrapper: CallingxDidDisplayIncomingCall body:@{
      @"error" : error && error.localizedDescription ? error.localizedDescription : @"",
      @"errorCode" : error ? [callKeep getIncomingCallErrorCode: error] : @"",
      @"callId" : callId,
      @"handle" : handle,
      @"localizedCallerName" : localizedCallerName ? localizedCallerName : @"",
      @"hasVideo" : hasVideo ? @"1" : @"0",
      @"supportsHolding" : supportsHolding ? @"1" : @"0",
      @"supportsDTMF" : supportsDTMF ? @"1" : @"0",
      @"supportsGrouping" : supportsGrouping ? @"1" : @"0",
      @"supportsUngrouping" : supportsUngrouping ? @"1" : @"0",
      @"fromPushKit" : fromPushKit ? @"1" : @"0",
      @"payload" : payload ? payload : @"",
    }];
    
    if (error == nil) {
      NSLog(@"[Callingx][reportNewIncomingCall] success callId = %@", callId);
    }
    
    if (completion != nil) {
      NSLog(@"[Callingx][reportNewIncomingCall] completion");
      completion();
    }
  }];
}

//+ (BOOL)application:(UIApplication *)application
//continueUserActivity:(NSUserActivity *)userActivity
// restorationHandler:(void(^)(NSArray * __nullable restorableObjects))restorationHandler
//{
//#ifdef DEBUG
//    NSLog(@"[Callingx][application:continueUserActivity]");
//#endif
//    INInteraction *interaction = userActivity.interaction;
//    INPerson *contact;
//    NSString *handle;
//    BOOL isAudioCall;
//    BOOL isVideoCall;
//
//    // HACK TO AVOID XCODE 10 COMPILE CRASH
//    // REMOVE ON NEXT MAJOR RELEASE OF RNCALLKIT
//#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
//    //XCode 11
//    // iOS 13 returns an INStartCallIntent userActivity type
//    if (@available(iOS 13, *)) {
//        INStartCallIntent *intent = (INStartCallIntent*)interaction.intent;
//        // callCapability is not available on iOS > 13.2, but it is in 13.1 weirdly...
//        if ([intent respondsToSelector:@selector(callCapability)]) {
//            isAudioCall = intent.callCapability == INCallCapabilityAudioCall;
//            isVideoCall = intent.callCapability == INCallCapabilityVideoCall;
//        } else {
//            isAudioCall = [userActivity.activityType isEqualToString:INStartAudioCallIntentIdentifier];
//            isVideoCall = [userActivity.activityType isEqualToString:INStartVideoCallIntentIdentifier];
//        }
//    } else {
//#endif
//        // XCode 10 and below
//        isAudioCall = [userActivity.activityType isEqualToString:INStartAudioCallIntentIdentifier];
//        isVideoCall = [userActivity.activityType isEqualToString:INStartVideoCallIntentIdentifier];
//        // HACK TO AVOID XCODE 10 COMPILE CRASH
//        // REMOVE ON NEXT MAJOR RELEASE OF RNCALLKIT
//#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
//    }
//#endif
//
//    if (isAudioCall) {
//        INStartAudioCallIntent *startAudioCallIntent = (INStartAudioCallIntent *)interaction.intent;
//        contact = [startAudioCallIntent.contacts firstObject];
//    } else if (isVideoCall) {
//        INStartVideoCallIntent *startVideoCallIntent = (INStartVideoCallIntent *)interaction.intent;
//        contact = [startVideoCallIntent.contacts firstObject];
//    }
//
//    if (contact != nil) {
//        handle = contact.personHandle.value;
//    }
//
//    if (handle != nil && handle.length > 0 ){
//        NSDictionary *userInfo = @{
//            @"handle": handle,
//            @"video": @(isVideoCall)
//        };
//
//        RNCallKeep *callKeep = [RNCallKeep allocWithZone: nil];
//        [callKeep sendEventWithNameWrapper:CallingxDidReceiveStartCallAction body:userInfo];
//        return YES;
//    }
//    return NO;
//}
+ (BOOL)canRegisterCall {
  BOOL hasRegisteredCall = [Callingx hasRegisteredCall];
  NSLog(@"[Callingx][canRegisterCall] hasRegisteredCall = %@, _shouldRejectCallWhenBusy = %@", hasRegisteredCall ? @"YES" : @"NO", _shouldRejectCallWhenBusy ? @"YES" : @"NO");
  return !_shouldRejectCallWhenBusy || (_shouldRejectCallWhenBusy && !hasRegisteredCall);
}

+ (BOOL)hasRegisteredCall {
  [Callingx initUUIDStorage];
  
  NSArray<NSUUID *> *appUUIDs = [uuidStorage allUUIDs];
  if ([appUUIDs count] == 0) return NO;
  
  CXCallObserver *observer = [[CXCallObserver alloc] init];
  
  for (CXCall *call in observer.calls) {
    for (NSUUID *uuid in appUUIDs) {
      if ([call.UUID isEqual:uuid]) {
        return YES;
      }
    }
  }
  
  return NO;
}

+ (NSString *)getAudioOutput {
  @try {
    NSArray<AVAudioSessionPortDescription *> *outputs =
        [AVAudioSession sharedInstance].currentRoute.outputs;
    if (outputs != nil && outputs.count > 0) {
      return outputs[0].portType;
    }
  } @catch (NSException *error) {
    NSLog(@"getAudioOutput error :%@", [error description]);
  }

  return nil;
}

+ (void)endCall:(NSString *)callId reason:(int)reason {
#ifdef DEBUG
  NSLog(@"[Callingx][endCall] callId = %@ reason = %d", callId, reason);
#endif
  NSUUID *uuid = [uuidStorage getUUIDForCid:callId];
  if (uuid == nil) {
    return;
  }

  switch (reason) {
  case 1:
    [sharedProvider reportCallWithUUID:uuid
                           endedAtDate:[NSDate date]
                                reason:CXCallEndedReasonFailed];
    break;
  case 2:
    [sharedProvider reportCallWithUUID:uuid
                           endedAtDate:[NSDate date]
                                reason:CXCallEndedReasonRemoteEnded];
    break;
  case 3:
    [sharedProvider reportCallWithUUID:uuid
                           endedAtDate:[NSDate date]
                                reason:CXCallEndedReasonUnanswered];
    break;
  case 4:
    [sharedProvider reportCallWithUUID:uuid
                           endedAtDate:[NSDate date]
                                reason:CXCallEndedReasonAnsweredElsewhere];
    break;
  case 5:
    [sharedProvider reportCallWithUUID:uuid
                           endedAtDate:[NSDate date]
                                reason:CXCallEndedReasonDeclinedElsewhere];
    break;
  default:
    break;
  }

  [uuidStorage removeCid:callId];
  _shouldRejectCallWhenBusy = NO;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

+ (NSString *)moduleName {
  return @"Callingx";
}

#pragma mark - Instance methods

- (instancetype)init {
#ifdef DEBUG
  NSLog(@"[Callingx][init]");
#endif
  if (self = [super init]) {
    _isSetup = NO;
    _delayedEvents = [NSMutableArray array];
    _canSendEvents = NO;

    [[NSNotificationCenter defaultCenter]
     addObserver:self
     selector:@selector(onAudioRouteChange:)
     name:AVAudioSessionRouteChangeNotification
     object:nil];
    
    // Init provider directly, in case of an app killed and when we've already
    // stored our settings
    [Callingx initCallKitProvider];
    [Callingx initUUIDStorage];

    self.callKeepProvider = sharedProvider;
    [self.callKeepProvider setDelegate:nil queue:nil];
    [self.callKeepProvider setDelegate:self queue:nil];
  }

  return self;
}

- (void)dealloc {
#ifdef DEBUG
  NSLog(@"[Callingx][dealloc]");
#endif
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  if (self.callKeepProvider != nil) {
    [self.callKeepProvider setDelegate:nil queue:nil];
    [self.callKeepProvider invalidate];
  }
  sharedProvider = nil;
  _canSendEvents = NO;
  _delayedEvents = nil;
  _isSetup = NO;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeCallingxSpecJSI>(params);
}

- (void)requestTransaction:(CXTransaction *)transaction {
#ifdef DEBUG
  NSLog(@"[Callingx][requestTransaction] transaction = %@", transaction);
#endif
  if (self.callKeepCallController == nil) {
    self.callKeepCallController = [[CXCallController alloc] init];
  }
  [self.callKeepCallController
      requestTransaction:transaction
              completion:^(NSError *_Nullable error) {
                if (error != nil) {
                  NSLog(@"[Callingx][requestTransaction] Error requesting "
                        @"transaction (%@): (%@)",
                        transaction.actions, error);
                } else {
                  NSLog(@"[Callingx][requestTransaction] Requested "
                        @"transaction successfully");

                  // CXStartCallAction
                  if ([[transaction.actions firstObject] isKindOfClass:[CXStartCallAction class]]) {
                    CXStartCallAction *startCallAction = [transaction.actions firstObject];
                    CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
                    callUpdate.remoteHandle = startCallAction.handle;
                    callUpdate.hasVideo = startCallAction.video;
                    callUpdate.localizedCallerName = startCallAction.contactIdentifier;
                    callUpdate.supportsDTMF = NO; //configurable?
                    callUpdate.supportsHolding = NO; //configurable?
                    callUpdate.supportsGrouping = NO; //configurable?
                    callUpdate.supportsUngrouping = NO; //configurable?
                    [self.callKeepProvider reportCallWithUUID:startCallAction.callUUID updated:callUpdate];
                  }
                }
              }];
}

- (void)sendEventWithNameWrapper:(NSString *)name body:(id)body {
  NSLog(@"[Callingx] sendEventWithNameWrapper: %@", name);
  
  NSDictionary *dictionary = [NSDictionary
      dictionaryWithObjectsAndKeys:name, @"eventName", body, @"params", nil];
  
  if (_canSendEvents) {
    [self emitOnNewEvent: dictionary];
  } else {
    [_delayedEvents addObject:dictionary];
  }
  NSLog(@"[Callingx] delayedEvents: %@", _delayedEvents);
}

- (void)onAudioRouteChange:(NSNotification *)notification {
  NSDictionary *info = notification.userInfo;
  NSInteger reason = [[info valueForKey:AVAudioSessionRouteChangeReasonKey] integerValue];
  NSString *output = [Callingx getAudioOutput];

  if (output == nil) {
    return;
  }

  NSDictionary *params = @{
    @"output" : output,
    @"reason" : @(reason),
  };
  NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:
    CallingxDidChangeAudioRoute, @"eventName",
    params, @"params",
    nil
  ];
   [self emitOnNewEvent: dictionary];
   [self sendEventWithNameWrapper:CallingxDidChangeAudioRoute body:params];
}

- (NSString *)getIncomingCallErrorCode:(NSError *)error {
  if ([error code] == CXErrorCodeIncomingCallErrorUnentitled) {
    return @"Unentitled";
  } else if ([error code] == CXErrorCodeIncomingCallErrorCallUUIDAlreadyExists) {
    return @"CallUUIDAlreadyExists";
  } else if ([error code] == CXErrorCodeIncomingCallErrorFilteredByDoNotDisturb) {
    return @"FilteredByDoNotDisturb";
  } else if ([error code] == CXErrorCodeIncomingCallErrorFilteredByBlockList) {
    return @"FilteredByBlockList";
  } else {
    return @"Unknown";
  }
}

#pragma mark - Turbo module methods

- (void)setupiOS:(JS::NativeCallingx::SpecSetupiOSOptions &)options {
  NSDictionary *optionsDict = @{
    @"supportsVideo" : @(options.supportsVideo()),
    @"maximumCallsPerCallGroup" : @(options.maximumCallsPerCallGroup()),
    @"maximumCallGroups" : @(options.maximumCallGroups()),
    @"handleType" : options.handleType(),
    @"ringtoneSound" : options.sound(),
    @"imageName" : options.imageName(),
    @"includesCallsInRecents" : @(options.callsHistory()),
    @"autoConfigureAudioSession" : @(options.setupAudioSession())
  };
  
  _version = [[[NSProcessInfo alloc] init] operatingSystemVersion];
  self.callKeepCallController = [[CXCallController alloc] init];

  [Settings setSettings:optionsDict];
  [Callingx initCallKitProvider];
  [Callingx initUUIDStorage];

  self.callKeepProvider = sharedProvider;
  [self.callKeepProvider setDelegate:nil queue:nil];
  [self.callKeepProvider setDelegate:self queue:nil];

  _isSetup = YES;
}

- (void)setShouldRejectCallWhenBusy:(BOOL)shouldReject {
  _shouldRejectCallWhenBusy = shouldReject;
}

- (NSArray<NSDictionary *> *)getInitialEvents {
#ifdef DEBUG
  NSLog(@"[Callingx][getInitialEvents] delayedEvents = %@", _delayedEvents);
#endif
  NSMutableArray *events = _delayedEvents ? [_delayedEvents copy] : [NSMutableArray array];
  _delayedEvents = [NSMutableArray array];
  _canSendEvents = YES;
  return events;
}

- (void)clearInitialEvents {
  _delayedEvents = [NSMutableArray array];
}

- (void)answerIncomingCall:(nonnull NSString *)callId
                   resolve:(nonnull RCTPromiseResolveBlock)resolve
                    reject:(nonnull RCTPromiseRejectBlock)reject {
#ifdef DEBUG
  NSLog(@"[Callingx][answerIncomingCall] callId = %@", callId);
#endif
  NSUUID *uuid = [uuidStorage getUUIDForCid:callId];
  if (uuid == nil) {
    NSLog(@"[Callingx][answerIncomingCall] callId not found");
    resolve(@NO);
    return;
  }

  _isSelfAnswered = true;
  CXAnswerCallAction *answerCallAction = [[CXAnswerCallAction alloc] initWithCallUUID:uuid];
  CXTransaction *transaction = [[CXTransaction alloc] init];
  [transaction addAction:answerCallAction];

  [self requestTransaction:transaction];
  resolve(@YES);
}

- (void)displayIncomingCall:(nonnull NSString *)callId
                phoneNumber:(nonnull NSString *)phoneNumber
                 callerName:(nonnull NSString *)callerName
                   hasVideo:(BOOL)hasVideo
             displayOptions:
                 (JS::NativeCallingx::SpecDisplayIncomingCallDisplayOptions &)displayOptions
                    resolve:(nonnull RCTPromiseResolveBlock)resolve
                     reject:(nonnull RCTPromiseRejectBlock)reject {

  [Callingx reportNewIncomingCall:callId
                                handle:phoneNumber
                            handleType:@"number"
                              hasVideo:hasVideo
                   localizedCallerName:callerName
                       supportsHolding:NO // parametrize?
                          supportsDTMF:NO // parametrize?
                      supportsGrouping:NO // parametrize?
                    supportsUngrouping:NO // parametrize?
                           fromPushKit:NO
                               payload:nil
                 withCompletionHandler:nil];

  NSDictionary *settings = [Settings getSettings];
  NSNumber *timeout = settings[@"displayCallReachabilityTimeout"];

  if (timeout) {
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)([timeout intValue] * NSEC_PER_MSEC));
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void) {
      if (!self->_isSetup) {
#ifdef DEBUG
        NSLog(@"[Callingx] Displayed a call without a reachable app, ending "
              @"the call: %@",
              callId);
#endif
        [Callingx endCall:callId reason:CXCallEndedReasonFailed];
      }
    });
  }
  resolve(@YES);
}

- (void)endCallWithReason:(nonnull NSString *)callId
                  reason:(double)reason
                 resolve:(nonnull RCTPromiseResolveBlock)resolve
                  reject:(nonnull RCTPromiseRejectBlock)reject {
#ifdef DEBUG
  NSLog(@"[Callingx][endCallWithReason] callId = %@ reason = %f", callId, reason);
#endif
  [Callingx endCall:callId reason:reason];
  resolve(@YES);
}

- (void)endCall:(nonnull NSString *)callId
        resolve:(nonnull RCTPromiseResolveBlock)resolve
         reject:(nonnull RCTPromiseRejectBlock)reject {
#ifdef DEBUG
  NSLog(@"[Callingx][endCall] callId = %@", callId);
#endif
  NSUUID *uuid = [uuidStorage getUUIDForCid:callId];
  if (uuid == nil) {
    NSLog(@"[Callingx][endCall] callId not found");
    resolve(@NO);
    return;
  }

  _isSelfEnded = true;
  CXEndCallAction *endCallAction = [[CXEndCallAction alloc] initWithCallUUID:uuid];
  CXTransaction *transaction = [[CXTransaction alloc] initWithAction:endCallAction];

  [self requestTransaction:transaction];
  resolve(@YES);
}

- (NSNumber *)isCallRegistered:(nonnull NSString *)callId {
  NSUUID *uuid = [uuidStorage getUUIDForCid:callId];
  if (uuid == nil) return @NO;
  
  CXCallObserver *observer = [[CXCallObserver alloc] init];
  for (CXCall *call in observer.calls) {
    if ([call.UUID isEqual:uuid]) {
      return @YES;
    }
  }

  return @NO;
}

- (NSNumber *)hasRegisteredCall {
  return @([Callingx hasRegisteredCall]);
}

- (void)setCurrentCallActive:(nonnull NSString *)callId
                     resolve:(nonnull RCTPromiseResolveBlock)resolve
                      reject:(nonnull RCTPromiseRejectBlock)reject {
  NSUUID *uuid = [uuidStorage getUUIDForCid:callId];
  if (uuid == nil) {
    NSLog(@"[Callingx][setCurrentCallActive] callId not found");
    resolve(@NO);
    return;
  }

  [self.callKeepProvider reportOutgoingCallWithUUID:uuid startedConnectingAtDate:[NSDate date]];
  [self.callKeepProvider reportOutgoingCallWithUUID:uuid connectedAtDate:[NSDate date]];
  resolve(@YES);
}

- (void)setMutedCall:(nonnull NSString *)callId
             isMuted:(BOOL)isMuted
             resolve:(nonnull RCTPromiseResolveBlock)resolve
              reject:(nonnull RCTPromiseRejectBlock)reject {
#ifdef DEBUG
  NSLog(@"[Callingx][setMutedCall] muted = %i", isMuted);
#endif
  NSUUID *uuid = [uuidStorage getUUIDForCid:callId];
  if (uuid == nil) {
    NSLog(@"[Callingx][setMutedCall] callId not found");
    resolve(@NO);
    return;
  }

  CXSetMutedCallAction *setMutedAction = [[CXSetMutedCallAction alloc] initWithCallUUID:uuid muted:isMuted];
  CXTransaction *transaction = [[CXTransaction alloc] init];
  [transaction addAction:setMutedAction];

  [self requestTransaction:transaction];
  resolve(@YES);
}

- (void)setOnHoldCall:(nonnull NSString *)callId
             isOnHold:(BOOL)isOnHold
              resolve:(nonnull RCTPromiseResolveBlock)resolve
               reject:(nonnull RCTPromiseRejectBlock)reject {
#ifdef DEBUG
  NSLog(@"[Callingx][setOnHold] uuidString = %@, shouldHold = %d", callId,
        isOnHold);
#endif
  NSUUID *uuid = [uuidStorage getUUIDForCid:callId];
  if (uuid == nil) {
    NSLog(@"[Callingx][setOnHoldCall] callId not found");
    resolve(@NO);
    return;
  }

  CXSetHeldCallAction *setHeldCallAction = [[CXSetHeldCallAction alloc] initWithCallUUID:uuid onHold:isOnHold];
  CXTransaction *transaction = [[CXTransaction alloc] init];
  [transaction addAction:setHeldCallAction];

  [self requestTransaction:transaction];
  resolve(@YES);
}

- (void)startCall:(nonnull NSString *)callId
       phoneNumber:(nonnull NSString *)phoneNumber
        callerName:(nonnull NSString *)callerName
          hasVideo:(BOOL)hasVideo
    displayOptions:(JS::NativeCallingx::SpecStartCallDisplayOptions &)displayOptions
           resolve:(nonnull RCTPromiseResolveBlock)resolve
            reject:(nonnull RCTPromiseRejectBlock)reject {
#ifdef DEBUG
  NSLog(@"[Callingx][startCall] uuidString = %@, phoneNumber = %@", callId, phoneNumber);
#endif
  CXHandleType _handleType = [Settings getHandleType:@"generic"];
  NSUUID *uuid = [uuidStorage getOrCreateUUIDForCid:callId];
  CXHandle *callHandle = [[CXHandle alloc] initWithType:_handleType value:phoneNumber];
  CXStartCallAction *startCallAction = [[CXStartCallAction alloc] initWithCallUUID:uuid handle:callHandle];
  [startCallAction setVideo:hasVideo];
  [startCallAction setContactIdentifier:callerName];

  CXTransaction *transaction = [[CXTransaction alloc] initWithAction:startCallAction];

  [self requestTransaction:transaction];
}

- (void)updateDisplay:(nonnull NSString *)callId
          phoneNumber:(nonnull NSString *)phoneNumber
           callerName:(nonnull NSString *)callerName
       displayOptions:
           (JS::NativeCallingx::SpecUpdateDisplayDisplayOptions &)displayOptions
              resolve:(nonnull RCTPromiseResolveBlock)resolve
               reject:(nonnull RCTPromiseRejectBlock)reject {
#ifdef DEBUG
  NSLog(
      @"[Callingx][updateDisplay] uuidString = %@ displayName = %@ uri = %@",
      callId, callerName, phoneNumber);
#endif
  NSUUID *uuid = [uuidStorage getUUIDForCid:callId];
  if (uuid == nil) {
    return;
  }

  CXHandle *callHandle = [[CXHandle alloc] initWithType:CXHandleTypePhoneNumber value:phoneNumber];
  CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
  callUpdate.localizedCallerName = callerName;
  callUpdate.remoteHandle = callHandle;

  //    if ([options valueForKey:@"hasVideo"] != nil) {
  //        callUpdate.hasVideo = [RCTConvert BOOL:options[@"hasVideo"]];
  //    }
  //    if ([options valueForKey:@"supportsHolding"] != nil) {
  //        callUpdate.supportsHolding = [RCTConvert
  //        BOOL:options[@"supportsHolding"]];
  //    }
  //    if ([options valueForKey:@"supportsDTMF"] != nil) {
  //        callUpdate.supportsDTMF = [RCTConvert
  //        BOOL:options[@"supportsDTMF"]];
  //    }
  //    if ([options valueForKey:@"supportsGrouping"] != nil) {
  //        callUpdate.supportsGrouping = [RCTConvert
  //        BOOL:options[@"supportsGrouping"]];
  //    }
  //    if ([options valueForKey:@"supportsUngrouping"] != nil) {
  //        callUpdate.supportsUngrouping = [RCTConvert
  //        BOOL:options[@"supportsUngrouping"]];
  //    }

  [self.callKeepProvider reportCallWithUUID:uuid updated:callUpdate];
  resolve(@YES);
}

- (void)log:(NSString *)message level:(NSString *)level {
  NSLog(@"[Callingx][log] %@, %@", message, level);
}

- (void)setupAndroid:(JS::NativeCallingx::SpecSetupAndroidOptions &)options {
  // leave empty
}

- (void)startBackgroundTask:(NSString *)taskName
                    timeout:(double)timeout
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  // leave empty
  resolve(@YES);
}

- (void)stopBackgroundTask:(NSString *)taskName
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
  // leave empty
  resolve(@YES);
}

- (nonnull NSNumber *)canPostNotifications { 
  return @YES;
}


#pragma mark - CXProviderDelegate

- (void)providerDidReset:(CXProvider *)provider {
#ifdef DEBUG
  NSLog(@"[Callingx][providerDidReset]");
#endif
  // this means something big changed, so tell the JS. The JS should
  // probably respond by hanging up all calls.
  [self sendEventWithNameWrapper:CallingxProviderReset body:nil];
}

- (void)provider:(CXProvider *)provider
    performStartCallAction:(CXStartCallAction *)action {
#ifdef DEBUG
  NSLog(@"[Callingx][CXProviderDelegate][provider:performStartCallAction]");
#endif
  NSString *callId = [uuidStorage getCidForUUID:action.callUUID];
  if (callId == nil) {
    NSLog(@"[Callingx][CXProviderDelegate][provider:performStartCallAction] callId not found");
    return;
  }
  // do this first, audio sessions are flakey
  [AudioSessionManager createAudioSessionIfNeeded];
  // tell the JS to actually make the call
  [self sendEventWithNameWrapper:CallingxDidReceiveStartCallAction
                            body:@{
                              @"callId" : callId,
                              @"handle" : action.handle.value
                            }];
  [action fulfill];
}

// Update call contact info
// @deprecated
// RCT_EXPORT_METHOD(reportUpdatedCall : (NSString *)uuidString contactIdentifier : (NSString *)contactIdentifier) {
// #ifdef DEBUG
//   NSLog(@"[deprecated][Callingx][reportUpdatedCall] contactIdentifier = %@",
//         contactIdentifier);
// #endif
//   NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:uuidString];
//   CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
//   callUpdate.localizedCallerName = contactIdentifier;

//   [self.callKeepProvider reportCallWithUUID:uuid updated:callUpdate];
// }

- (void)provider:(CXProvider *)provider
    performAnswerCallAction:(CXAnswerCallAction *)action {
#ifdef DEBUG
  NSLog(@"[Callingx][CXProviderDelegate][provider:performAnswerCallAction] isSelfAnswered: %d", _isSelfAnswered);
#endif
  NSString *callId = [uuidStorage getCidForUUID:action.callUUID];
  if (callId == nil) {
    NSLog(@"[Callingx][CXProviderDelegate][provider:performAnswerCallAction] callId not found");
    [action fail];
    return;
  }

  [AudioSessionManager createAudioSessionIfNeeded];
  
  NSString *source = _isSelfAnswered ? @"app" : @"sys";
  [self sendEventWithNameWrapper:CallingxPerformAnswerCallAction
                            body:@{
                              @"callId" : callId,
                              @"source" : source
                            }];
  _isSelfAnswered = false;
  [action fulfill];
}

- (void)provider:(CXProvider *)provider
    performEndCallAction:(CXEndCallAction *)action {
#ifdef DEBUG
  NSLog(@"[Callingx][CXProviderDelegate][provider:performEndCallAction] isSelfEnded: %d", _isSelfEnded);
#endif
  NSString *callId = [uuidStorage getCidForUUID:action.callUUID];
  if (callId == nil) {
    NSLog(@"[Callingx][CXProviderDelegate][provider:performEndCallAction] callId not found");
    [action fail];
    return;
  }

  NSString *source = _isSelfEnded ? @"app" : @"sys";
  [self sendEventWithNameWrapper:CallingxPerformEndCallAction
                            body:@{
                              @"callId" : callId,
                              @"source" : source
                            }];
  _isSelfEnded = false;
  _shouldRejectCallWhenBusy = NO;
  [uuidStorage removeCid:callId];
  
  [action fulfill];
}

- (void)provider:(CXProvider *)provider
    performSetHeldCallAction:(CXSetHeldCallAction *)action {
#ifdef DEBUG
  NSLog(@"[Callingx][CXProviderDelegate][provider:performSetHeldCallAction]");
#endif
  NSString *callId = [uuidStorage getCidForUUID:action.callUUID];
  if (callId == nil) {
    NSLog(@"[Callingx][CXProviderDelegate][provider:performSetHeldCallAction] callId not found");
    [action fail];
    return;
  }

  [self sendEventWithNameWrapper:CallingxDidToggleHoldAction
                            body:@{
                              @"hold" : @(action.onHold),
                              @"callId" : callId
                            }];
  [action fulfill];
}

- (void)provider:(CXProvider *)provider
    performPlayDTMFCallAction:(CXPlayDTMFCallAction *)action {
#ifdef DEBUG
  NSLog(@"[Callingx][CXProviderDelegate][provider:performPlayDTMFCallAction]");
#endif
  NSString *callId = [uuidStorage getCidForUUID:action.callUUID];
  if (callId == nil) {
    NSLog(@"[Callingx][CXProviderDelegate][provider:performPlayDTMFCallAction] callId not found");
    [action fail];
    return;
  }

  [self sendEventWithNameWrapper:CallingxPerformPlayDTMFCallAction
                            body:@{
                              @"digits" : action.digits,
                              @"callId" : callId
                            }];
  [action fulfill];
}

- (void)provider:(CXProvider *)provider
    performSetMutedCallAction:(CXSetMutedCallAction *)action {
#ifdef DEBUG
  NSLog(@"[Callingx][CXProviderDelegate][provider:performSetMutedCallAction]");
#endif
  NSString *callId = [uuidStorage getCidForUUID:action.callUUID];
  if (callId == nil) {
    NSLog(@"[Callingx][CXProviderDelegate][provider:performSetMutedCallAction] callId not found");
    [action fail];
    return;
  }

  [self sendEventWithNameWrapper:CallingxDidPerformSetMutedCallAction
                            body:@{
                              @"muted" : @(action.muted),
                              @"callId" : callId
                            }];
  [action fulfill];
}

- (void)provider:(CXProvider *)provider
    timedOutPerformingAction:(CXAction *)action {
#ifdef DEBUG
  NSLog(@"[Callingx][CXProviderDelegate][provider:timedOutPerformingAction]");
#endif
}

- (void)provider:(CXProvider *)provider
    didActivateAudioSession:(AVAudioSession *)audioSession {
#ifdef DEBUG
  NSLog(@"[Callingx][CXProviderDelegate][provider:didActivateAudioSession]");
#endif
  NSDictionary *userInfo = @{
    AVAudioSessionInterruptionTypeKey :
        [NSNumber numberWithInt:AVAudioSessionInterruptionTypeEnded],
    AVAudioSessionInterruptionOptionKey :
        [NSNumber numberWithInt:AVAudioSessionInterruptionOptionShouldResume]
  };
  [[NSNotificationCenter defaultCenter]
      postNotificationName:AVAudioSessionInterruptionNotification
                    object:nil
                  userInfo:userInfo];

  [self sendEventWithNameWrapper:CallingxDidActivateAudioSession body:nil];
}

- (void)provider:(CXProvider *)provider
    didDeactivateAudioSession:(AVAudioSession *)audioSession {
#ifdef DEBUG
  NSLog(
      @"[Callingx][CXProviderDelegate][provider:didDeactivateAudioSession]");
#endif
  [self sendEventWithNameWrapper:CallingxDidDeactivateAudioSession body:nil];
}

@end
