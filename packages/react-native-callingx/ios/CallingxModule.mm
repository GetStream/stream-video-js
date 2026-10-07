#import "CallingxModule.h"

// Compiled without modules, so the Swift header's @imports are skipped; import its dependencies first.
#import <CallKit/CallKit.h>

#if __has_include("Callingx-Swift.h")
#import "Callingx-Swift.h"
#else
#import <Callingx/Callingx-Swift.h>
#endif

@interface CallingxModule () <CallingxEventEmitter, VoipNotificationsEventEmitter>
@end

@implementation CallingxModule {
  CallingxImpl *_moduleImpl;
}

@synthesize moduleRegistry = _moduleRegistry;

#pragma mark - Singleton

+ (id)allocWithZone:(NSZone *)zone {
  static CallingxModule *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [super allocWithZone:zone];
  });
  return sharedInstance;
}

#pragma mark - Module Registration

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

+ (NSString *)moduleName {
  return @"Callingx";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeCallingxSpecJSI>(params);
}

#pragma mark - Instance Lifecycle

- (instancetype)init {
  if (self = [super init]) {
    _moduleImpl = [CallingxImpl getSharedInstance];
    _moduleImpl.eventEmitter = self;

    [VoipNotificationsManager shared].eventEmitter = self;
  }
  return self;
}

- (void)dealloc {
  _moduleImpl = nil;
}

#pragma mark - Event Emission

- (void)emitEvent:(NSDictionary *)dictionary {
  [self emitOnNewEvent:dictionary];
}

- (void)emitVoipEvent:(NSDictionary *)dictionary {
  [self emitOnNewVoipEvent:dictionary];
}

#pragma mark - Setup

- (NSNumber *)setupiOS:(JS::NativeCallingx::SpecSetupiOSOptions &)options {
  NSDictionary *optionsDict = @{
    @"supportsVideo" : @(options.supportsVideo()),
    @"maximumCallsPerCallGroup" : @(options.maximumCallsPerCallGroup()),
    @"maximumCallGroups" : @(options.maximumCallGroups()),
    @"handleType" : options.handleType(),
    @"ringtoneSound" : options.sound(),
    @"imageName" : options.imageName(),
    @"includesCallsInRecents" : @(options.callsHistory()),
    @"displayCallTimeout" : @(options.displayCallTimeout()),
    @"skipIncomingPushInForeground" : @(options.skipIncomingPushInForeground())
  };

  [_moduleImpl setupWithOptions:optionsDict];
  // CallingxImpl reaches the AudioDeviceModule through WebRTCModule.
  _moduleImpl.webRTCModule = [self.moduleRegistry moduleForName:"WebRTCModule"];
  return @YES;
}

- (NSNumber *)setupAndroid:(JS::NativeCallingx::SpecSetupAndroidOptions &)options {
  // iOS only - leave empty
  return @YES;
}

#pragma mark - Audio

- (NSNumber *)wireAudioEngineSubscription {
  [_moduleImpl wireAudioEngineSubscription];
  return @YES;
}

- (NSNumber *)unwireAudioEngineSubscription {
  [_moduleImpl unwireAudioEngineSubscription];
  return @YES;
}

- (NSNumber *)setDefaultAudioDeviceEndpointType:(NSString *)endpointType {
  [_moduleImpl setDefaultAudioDeviceEndpointType:endpointType];
  return @YES;
}

- (NSString *)getAvailableAudioEndpoints:(NSString *)callId {
  return @"{\"endpoints\":[],\"currentEndpoint\":null}";
}

- (NSNumber *)requestAudioEndpointChange:(NSString *)callId
                              endpointId:(NSString *)endpointId {
  // Not implemented on iOS
  return @YES;
}

#pragma mark - Settings

- (NSNumber *)setShouldRejectCallWhenBusy:(BOOL)shouldReject {
  [Settings setShouldRejectCallWhenBusy:shouldReject];
  return @YES;
}

- (NSNumber *)canPostNotifications {
  return @YES;
}

- (NSNumber *)isTelecomBacked {
  // Android-only Telecom routing; iOS uses the CallKit bypass instead.
  return @NO;
}

#pragma mark - Events

- (NSArray<NSDictionary *> *)getInitialEvents {
  return [_moduleImpl getInitialEvents];
}

- (NSArray<NSDictionary *> *)getInitialVoipEvents {
  return [[VoipNotificationsManager shared] getInitialEvents];
}

- (NSNumber *)registerVoipToken {
  [[VoipNotificationsManager shared] registerVoipToken];
  return @YES;
}

#pragma mark - Call State

- (NSArray<NSString *> *)getRegisteredCallIds {
  return @[];
}

- (NSNumber *)isCallTracked:(NSString *)callId {
  return @([_moduleImpl isCallTracked:callId]);
}

- (NSNumber *)hasRegisteredCall {
  return @([CallingxImpl hasRegisteredCall]);
}

#pragma mark - Call Controls

- (void)displayIncomingCall:(NSString *)callId
                phoneNumber:(NSString *)phoneNumber
                 callerName:(NSString *)callerName
                   hasVideo:(BOOL)hasVideo
             displayOptions:(JS::NativeCallingx::SpecDisplayIncomingCallDisplayOptions &)displayOptions
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  [_moduleImpl displayIncomingCallWithCallId:callId
                                 phoneNumber:phoneNumber
                                  callerName:callerName
                                    hasVideo:hasVideo
                                     resolve:resolve
                                      reject:reject
  ];
}

- (void)startCall:(NSString *)callId
      phoneNumber:(NSString *)phoneNumber
       callerName:(NSString *)callerName
         hasVideo:(BOOL)hasVideo
   displayOptions:(JS::NativeCallingx::SpecStartCallDisplayOptions &)displayOptions
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  [_moduleImpl startCallWithCallId:callId
                 phoneNumber:phoneNumber
                  callerName:callerName
                    hasVideo:hasVideo];
  resolve(@YES);
}

- (NSNumber *)answerIncomingCall:(NSString *)callId {
  return @([_moduleImpl answerIncomingCall:callId]);
}

- (NSNumber *)setCurrentCallActive:(NSString *)callId {
  return @([_moduleImpl setCurrentCallActive:callId]);
}

- (NSNumber *)updateDisplay:(NSString *)callId
                phoneNumber:(NSString *)phoneNumber
                 callerName:(NSString *)callerName
             displayOptions:(JS::NativeCallingx::SpecUpdateDisplayDisplayOptions &)displayOptions {
  return @([_moduleImpl updateDisplayWithCallId:callId
                                    phoneNumber:phoneNumber
                                     callerName:callerName]);
}

- (NSNumber *)endCallWithReason:(NSString *)callId
                         reason:(double)reason {
  [CallingxImpl endCall:callId reason:(int)reason];
  return @YES;
}

- (NSNumber *)endCall:(NSString *)callId {
  return @([_moduleImpl endCall:callId]);
}

- (NSNumber *)setMutedCall:(NSString *)callId
                   isMuted:(BOOL)isMuted {
  return @([_moduleImpl setMutedCall:callId isMuted:isMuted]);
}

- (NSNumber *)setOnHoldCall:(NSString *)callId
                   isOnHold:(BOOL)isOnHold {
  return @([_moduleImpl setOnHoldCall:callId isOnHold:isOnHold]);
}

- (NSNumber *)fulfillAnswerCallAction:(NSString *)callId
                              didFail:(BOOL)didFail {
  [_moduleImpl fulfillAnswerCallAction:callId didFail:didFail];
  return @YES;
}

- (NSNumber *)fulfillEndCallAction:(NSString *)callId
                           didFail:(BOOL)didFail {
  [_moduleImpl fulfillEndCallAction:callId didFail:didFail];
  return @YES;
}

#pragma mark - Background Tasks and Service

- (NSNumber *)startBackgroundTask:(NSString *)taskName
                          timeout:(double)timeout {
  // Not implemented on iOS
  return @YES;
}

- (NSNumber *)stopBackgroundTask:(NSString *)taskName {
  // Not implemented on iOS
  return @YES;
}

- (NSNumber *)stopService {
  // Not implemented on iOS
  return @YES;
}

#pragma mark - Logging

- (NSNumber *)log:(NSString *)message
            level:(NSString *)level {
  [CallingxLogBridge js:message level:level];
  return @YES;
}

@end
