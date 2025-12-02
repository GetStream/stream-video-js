//
//  Callingx.m
//  POCCallingX
//
//  Created by Artem Grintsevich on 17/11/2025.
//

#import "Callingx.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTConvert.h>

#import <AVFoundation/AVAudioSession.h>
#import <CallKit/CallKit.h>
#import "UUIDStorage.h"

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

static NSString *const RNCallKeepHandleStartCallNotification = @"RNCallKeepHandleStartCallNotification";
static NSString *const RNCallKeepDidActivateAudioSession = @"RNCallKeepDidActivateAudioSession";
static NSString *const RNCallKeepDidDeactivateAudioSession = @"RNCallKeepDidDeactivateAudioSession";
static NSString *const RNCallKeepPerformPlayDTMFCallAction = @"RNCallKeepDidPerformDTMFAction";
static NSString *const RNCallKeepProviderReset = @"RNCallKeepProviderReset";
static NSString *const RNCallKeepCheckReachability = @"RNCallKeepCheckReachability";

@implementation Callingx {
  NSOperatingSystemVersion _version;
  bool _isReachable;
  bool _isInitialized;
  NSMutableArray *_delayedEvents;
}

static bool isSetupNatively;
static CXProvider *sharedProvider;
static UUIDStorage *uuidStorage;

#pragma mark - Class Methods

+ (id)allocWithZone:(NSZone *)zone {
  static Callingx *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [super allocWithZone:zone];
  });
  return sharedInstance;
}

+ (NSDictionary *)getSettings {
  return [[NSUserDefaults standardUserDefaults] dictionaryForKey:@"CallingxSettings"];
}

+ (void)initUUIDStorage {
  if (uuidStorage == nil) {
    uuidStorage = [[UUIDStorage alloc] init];
    NSLog(@"[Callingx] initUUIDStorage");
  }
}

+ (void)initCallKitProvider {
  if (sharedProvider == nil) {
    NSDictionary *settings = [self getSettings];
    if (settings != nil) {
      sharedProvider = [[CXProvider alloc] initWithConfiguration:[Callingx getProviderConfiguration:settings]];
      NSLog(@"[Callingx] initCallKitProvider");
    }
  }
}

+ (CXProviderConfiguration *)getProviderConfiguration:(NSDictionary *)settings {
#ifdef DEBUG
  NSLog(@"[Callingx][getProviderConfiguration]");
#endif
  CXProviderConfiguration *providerConfiguration = [[CXProviderConfiguration alloc] init];
  providerConfiguration.supportsVideo = YES;
  providerConfiguration.maximumCallGroups = 3;
  providerConfiguration.maximumCallsPerCallGroup = 1;
  providerConfiguration.supportedHandleTypes = [Callingx getSupportedHandleTypes:settings[@"handleType"]];

  if (settings[@"supportsVideo"]) {
    providerConfiguration.supportsVideo = [settings[@"supportsVideo"] boolValue];
  }
  if (settings[@"maximumCallGroups"]) {
    providerConfiguration.maximumCallGroups = [settings[@"maximumCallGroups"] integerValue];
  }
  if (settings[@"maximumCallsPerCallGroup"]) {
    providerConfiguration.maximumCallsPerCallGroup = [settings[@"maximumCallsPerCallGroup"] integerValue];
  }
  if (settings[@"imageName"]) {
    providerConfiguration.iconTemplateImageData = UIImagePNGRepresentation([UIImage imageNamed:settings[@"imageName"]]);
  }
  if (settings[@"ringtoneSound"]) {
    providerConfiguration.ringtoneSound = settings[@"ringtoneSound"];
  }
  if (@available(iOS 11.0, *)) {
    if (settings[@"includesCallsInRecents"]) {
      providerConfiguration.includesCallsInRecents = [settings[@"includesCallsInRecents"] boolValue];
    }
  }
  return providerConfiguration;
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
#endif

  [Callingx initUUIDStorage];
  [Callingx initCallKitProvider];

  if ([uuidStorage containsCid:callId]) {
    NSLog(@"[Callingx][reportNewIncomingCall] callId already exists");
    return;
  }

  CXHandleType _handleType = [Callingx getHandleType:handleType];
  NSUUID *uuid = [uuidStorage getOrCreateUUIDForCid:callId];
  CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
  callUpdate.remoteHandle = [[CXHandle alloc] initWithType:_handleType value:handle];
  callUpdate.supportsHolding = supportsHolding;
  callUpdate.supportsDTMF = supportsDTMF;
  callUpdate.supportsGrouping = supportsGrouping;
  callUpdate.supportsUngrouping = supportsUngrouping;
  callUpdate.hasVideo = hasVideo;
  callUpdate.localizedCallerName = localizedCallerName;

  [sharedProvider
      reportNewIncomingCallWithUUID:uuid
                         update:callUpdate
                         completion:^(NSError *_Nullable error) {
                          NSLog(@"[Callingx][reportNewIncomingCall] callId = %@, error = %@", callId, error);
                           Callingx *callKeep = [Callingx allocWithZone:nil];
                           [callKeep
                               sendEventWithNameWrapper:
                                   CallingxDidDisplayIncomingCall
                                                   body:@{
                                                     @"error" : error && error.localizedDescription
                                                         ? error.localizedDescription
                                                         : @"",
                                                     @"errorCode" : error
                                                         ? [callKeep getIncomingCallErrorCode: error]
                                                         : @"",
                                                     @"callId" : callId,
                                                     @"handle" : handle,
                                                     @"localizedCallerName" : localizedCallerName
                                                         ? localizedCallerName
                                                         : @"",
                                                     @"hasVideo" : hasVideo
                                                         ? @"1"
                                                         : @"0",
                                                     @"supportsHolding" : supportsHolding
                                                         ? @"1"
                                                         : @"0",
                                                     @"supportsDTMF" : supportsDTMF
                                                         ? @"1"
                                                         : @"0",
                                                     @"supportsGrouping" : supportsGrouping
                                                         ? @"1"
                                                         : @"0",
                                                     @"supportsUngrouping" : supportsUngrouping
                                                         ? @"1"
                                                         : @"0",
                                                     @"fromPushKit" : fromPushKit 
                                                         ? @"1"
                                                         : @"0",
                                                     @"payload" : payload
                                                         ? payload
                                                         : @"",
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

+ (NSSet *)getSupportedHandleTypes:(id)handleType {
  if (handleType) {
    if ([handleType isKindOfClass:[NSArray class]]) {
      NSSet *types = [NSSet set];

      for (NSString *type in handleType) {
        types = [types setByAddingObject: [NSNumber numberWithInteger:[Callingx getHandleType:type]]];
      }

      return types;
    } else {
      CXHandleType _handleType = [Callingx getHandleType:handleType];

      return [NSSet setWithObjects:[NSNumber numberWithInteger:_handleType], nil];
    }
  } else {
    return [NSSet setWithObjects:[NSNumber numberWithInteger:CXHandleTypePhoneNumber], nil];
  }
}

+ (CXHandleType)getHandleType:(NSString *)handleType {
  if ([handleType isEqualToString:@"generic"]) {
    return CXHandleTypeGeneric;
  } else if ([handleType isEqualToString:@"number"]) {
    return CXHandleTypePhoneNumber;
  } else if ([handleType isEqualToString:@"phone"]) {
    return CXHandleTypePhoneNumber;
  } else if ([handleType isEqualToString:@"email"]) {
    return CXHandleTypeEmailAddress;
  } else {
    return CXHandleTypeGeneric;
  }
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

+ (void)setup:(NSDictionary *)options {
   Callingx *callKeep = [Callingx allocWithZone: nil];
   [callKeep setup:options];
   isSetupNatively = YES;
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
    _isReachable = NO;
    _isInitialized = NO;
    
    if (_delayedEvents == nil)
      _delayedEvents = [NSMutableArray array];

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
  _isInitialized = NO;
  _isReachable = NO;
}

// Override method of RCTEventEmitter
- (NSArray<NSString *> *)supportedEvents {
  return @[
    CallingxDidReceiveStartCallAction,
    CallingxPerformAnswerCallAction,
    CallingxPerformEndCallAction,
    CallingxDidPerformSetMutedCallAction,
    CallingxDidToggleHoldAction,
    CallingxDidLoadWithEvents,
    CallingxDidChangeAudioRoute,
    CallingxDidDisplayIncomingCall,
    RNCallKeepDidActivateAudioSession,
    RNCallKeepDidDeactivateAudioSession,
    RNCallKeepPerformPlayDTMFCallAction,
    RNCallKeepProviderReset,
    RNCallKeepCheckReachability,
  ];
}

//- (void)startObserving {
//  NSLog(@"[Callingx][startObserving]");
//  _hasListeners = YES;
//  if ([_delayedEvents count] > 0) {
////    [self sendEventWithName:CallingxDidLoadWithEvents body:_delayedEvents];
//    NSDictionary *dictionary = [
//      NSDictionary dictionaryWithObjectsAndKeys:
//        CallingxDidLoadWithEvents, @"name",
//      _delayedEvents, @"params",
//      nil
//    ];
//    [self emitOnNewEvent: dictionary];
//  }
//}
//
//- (void)stopObserving {
//  _hasListeners = FALSE;
//
//  // Fix for
//  // https://github.com/react-native-webrtc/react-native-callkeep/issues/406 We
//  // use Objective-C Key Value Coding(KVC) to sync _RTCEventEmitter_
//  // `_listenerCount`.
//  @try {
//    [self setValue:@0 forKey:@"_listenerCount"];
//  } @catch (NSException *e) {
//    NSLog(@"[Callingx][stopObserving] exception: %@", e);
//    NSLog(@"[Callingx][stopObserving] Callingx parent class "
//          @"RTCEventEmitter might have a broken state.");
//    NSLog(@"[Callingx][stopObserving] Please verify that the parent "
//          @"RTCEventEmitter.m has iVar `_listenerCount`.");
//  }
//}

- (void)setSettings:(NSDictionary *)options {
#ifdef DEBUG
  NSLog(@"[Callingx][setSettings] options = %@", options);
#endif
  NSDictionary *settings = [[NSMutableDictionary alloc] initWithDictionary:options];
  // Store settings in NSUserDefault
  [[NSUserDefaults standardUserDefaults] setObject:settings forKey:@"CallingxSettings"];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

- (void)configureAudioSession {
#ifdef DEBUG
  NSLog(@"[Callingx][configureAudioSession] Activating audio session");
#endif

  NSUInteger categoryOptions = AVAudioSessionCategoryOptionAllowBluetooth |
                               AVAudioSessionCategoryOptionAllowBluetoothA2DP;
  NSString *mode = AVAudioSessionModeDefault;

  NSDictionary *settings = [Callingx getSettings];
  if (settings && settings[@"audioSession"]) {
    if (settings[@"audioSession"][@"categoryOptions"]) {
      categoryOptions = [settings[@"audioSession"][@"categoryOptions"] integerValue];
    }

    if (settings[@"audioSession"][@"mode"]) {
      mode = settings[@"audioSession"][@"mode"];
    }
  }

  AVAudioSession *audioSession = [AVAudioSession sharedInstance];
  [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord
                withOptions:categoryOptions
                      error:nil];

  [audioSession setMode:mode error:nil];

  double sampleRate = 44100.0;
  [audioSession setPreferredSampleRate:sampleRate error:nil];

  NSTimeInterval bufferDuration = .005;
  [audioSession setPreferredIOBufferDuration:bufferDuration error:nil];
  [audioSession setActive:TRUE error:nil];
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
  
 if (_isInitialized) {
    [self emitOnNewEvent: dictionary];
 } else {
   [_delayedEvents addObject:dictionary];
 }
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
  // [self emitOnNewEvent: dictionary];
  // [self sendEventWithNameWrapper:CallingxDidChangeAudioRoute body:params];
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

- (void)setup:(NSDictionary *)options {
  NSLog(@"[Callingx][setup] options = %@", options);
  if (isSetupNatively) {
#ifdef DEBUG
    NSLog(@"[Callingx][setup] already setup");
    RCTLog(@"[Callingx][setup] already setup in native code");
#endif
    return;
  }

#ifdef DEBUG
  NSLog(@"[Callingx][setup] options = %@", options);
#endif
  _version = [[[NSProcessInfo alloc] init] operatingSystemVersion];
  self.callKeepCallController = [[CXCallController alloc] init];

  [self setSettings:options];

  [Callingx initCallKitProvider];
  [Callingx initUUIDStorage];

  self.callKeepProvider = sharedProvider;
  [self.callKeepProvider setDelegate:nil queue:nil];
  [self.callKeepProvider setDelegate:self queue:nil];
}

#pragma mark - Turbo module methods

- (void)setupiOS:(JS::NativeCallingx::SpecSetupiOSOptions &)options {
  NSDictionary *optionsDict = @{
    @"appName" : options.appName(),
    @"supportsVideo" : @(options.supportsVideo()),
    @"maximumCallsPerCallGroup" : @(options.maximumCallsPerCallGroup()),
    @"maximumCallGroups" : @(options.maximumCallGroups()),
    @"handleType" : options.handleType()
  };
  [self setup:optionsDict];

  _isInitialized = YES;
}

- (NSArray<NSDictionary *> *)getInitialEvents {
#ifdef DEBUG
  NSLog(@"[Callingx][getInitialEvents] _delayedEvents = %@", _delayedEvents);
#endif
  return _delayedEvents;
}

- (void)clearInitialEvents:(nonnull RCTPromiseResolveBlock)resolve
                    reject:(nonnull RCTPromiseRejectBlock)reject {
  _delayedEvents = [NSMutableArray array];
  resolve(@YES);
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

  NSDictionary *settings = [Callingx getSettings];
  NSNumber *timeout = settings[@"displayCallReachabilityTimeout"];

  if (timeout) {
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)([timeout intValue] * NSEC_PER_MSEC));
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void) {
      if (!self->_isReachable) {
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

  CXEndCallAction *endCallAction = [[CXEndCallAction alloc] initWithCallUUID:uuid];
  CXTransaction *transaction = [[CXTransaction alloc] initWithAction:endCallAction];

  [self requestTransaction:transaction];
  resolve(@YES);
}

- (void)setCurrentCallActive:(nonnull NSString *)callId
                     resolve:(nonnull RCTPromiseResolveBlock)resolve
                      reject:(nonnull RCTPromiseRejectBlock)reject {
  //TODO: adjust implementation
  NSUUID *uuid = [uuidStorage getUUIDForCid:callId];
  if (uuid == nil) {
    NSLog(@"[Callingx][setCurrentCallActive] callId not found");
    resolve(@NO);
    return;
  }

  [self.callKeepProvider reportOutgoingCallWithUUID:uuid startedConnectingAtDate:[NSDate date]];
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
  NSLog(@"[Callingx][startCall] uuidString = %@", callId, phoneNumber);
#endif
  CXHandleType _handleType = [Callingx getHandleType:@"generic"];
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

#pragma mark - CXProviderDelegate

- (void)providerDidReset:(CXProvider *)provider {
#ifdef DEBUG
  NSLog(@"[Callingx][providerDidReset]");
#endif
  // this means something big changed, so tell the JS. The JS should
  // probably respond by hanging up all calls.
  [self sendEventWithNameWrapper:RNCallKeepProviderReset body:nil];
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
  [self configureAudioSession];
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
  NSLog(@"[Callingx][CXProviderDelegate][provider:performAnswerCallAction]");
#endif
  NSString *callId = [uuidStorage getCidForUUID:action.callUUID];
  if (callId == nil) {
    NSLog(@"[Callingx][CXProviderDelegate][provider:performAnswerCallAction] callId not found");
    [action fail];
    return;
  }

  [self configureAudioSession];
  [self sendEventWithNameWrapper:CallingxPerformAnswerCallAction
                            body:@{
                              @"callId" : callId
                            }];
  [action fulfill];
}

- (void)provider:(CXProvider *)provider
    performEndCallAction:(CXEndCallAction *)action {
#ifdef DEBUG
  NSLog(@"[Callingx][CXProviderDelegate][provider:performEndCallAction]");
#endif
  NSString *callId = [uuidStorage getCidForUUID:action.callUUID];
  if (callId == nil) {
    NSLog(@"[Callingx][CXProviderDelegate][provider:performEndCallAction] callId not found");
    [action fail];
    return;
  }

  [self sendEventWithNameWrapper:CallingxPerformEndCallAction
                            body:@{
                              @"callId" : callId
                            }];
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

  [self sendEventWithNameWrapper:RNCallKeepPerformPlayDTMFCallAction
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

  [self configureAudioSession];
  [self sendEventWithNameWrapper:RNCallKeepDidActivateAudioSession body:nil];
}

- (void)provider:(CXProvider *)provider
    didDeactivateAudioSession:(AVAudioSession *)audioSession {
#ifdef DEBUG
  NSLog(
      @"[Callingx][CXProviderDelegate][provider:didDeactivateAudioSession]");
#endif
  [self sendEventWithNameWrapper:RNCallKeepDidDeactivateAudioSession body:nil];
}

@end
