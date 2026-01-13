#import <CallingxSpec/CallingxSpec.h>
#import <React/RCTBridge+Private.h>

#import <AVFoundation/AVAudioSession.h>
#import <CallKit/CallKit.h>

// Import Swift generated header
#if __has_include("Callingx-Swift.h")
#import "Callingx-Swift.h"
#else
#import <Callingx/Callingx-Swift.h>
#endif

// MARK: - Callingx Turbo Module Interface

@interface Callingx : NativeCallingxSpecBase<NativeCallingxSpec, CallingxEventEmitter>

@property (nonatomic, strong) CXCallController *callKeepCallController;
@property (nonatomic, strong) CXProvider *callKeepProvider;

@end

@implementation Callingx {
  CallingxImpl *_moduleImpl;
}

#pragma mark - Singleton

+ (id)allocWithZone:(NSZone *)zone {
  static Callingx *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [super allocWithZone:zone];
  });
  return sharedInstance;
}

#pragma mark - Class Methods (Public API)

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

+ (NSString *)moduleName {
  return @"Callingx";
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
  
  [CallingxImpl reportNewIncomingCallWithCallId:callId
                                         handle:handle
                                     handleType:handleType
                                       hasVideo:hasVideo
                            localizedCallerName:localizedCallerName
                                supportsHolding:supportsHolding
                                   supportsDTMF:supportsDTMF
                               supportsGrouping:supportsGrouping
                             supportsUngrouping:supportsUngrouping
                                    fromPushKit:fromPushKit
                                        payload:payload
                                     completion:completion];
}

+ (BOOL)canRegisterCall {
  return [CallingxImpl canRegisterCall];
}

+ (void)endCall:(NSString *)callId reason:(int)reason {
  [CallingxImpl endCall:callId reason:reason];
}

#pragma mark - Instance Lifecycle

- (instancetype)init {
  if (self = [super init]) {
    _moduleImpl = [[CallingxImpl alloc] init];
    _moduleImpl.eventEmitter = self;
  }
  return self;
}

- (void)dealloc {
  _moduleImpl = nil;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeCallingxSpecJSI>(params);
}

#pragma mark - CallingxEventEmitter Protocol

- (void)emitEvent:(NSDictionary *)dictionary {
  [self emitOnNewEvent:dictionary];
}

#pragma mark - Turbo Module Methods

- (void)setupiOS:(JS::NativeCallingx::SpecSetupiOSOptions &)options {
  NSDictionary *optionsDict = @{
    @"supportsVideo" : @(options.supportsVideo()),
    @"maximumCallsPerCallGroup" : @(options.maximumCallsPerCallGroup()),
    @"maximumCallGroups" : @(options.maximumCallGroups()),
    @"handleType" : options.handleType(),
    @"ringtoneSound" : options.sound(),
    @"imageName" : options.imageName(),
    @"includesCallsInRecents" : @(options.callsHistory()),
    @"autoConfigureAudioSession" : @(options.setupAudioSession()),
    @"displayCallTimeout" : @(options.displayCallTimeout())
  };
  
  [_moduleImpl setupWithOptions:optionsDict];
  
  self.callKeepCallController = _moduleImpl.callKeepCallController;
  self.callKeepProvider = _moduleImpl.callKeepProvider;
}

- (void)setShouldRejectCallWhenBusy:(BOOL)shouldReject {
  [Settings setShouldRejectCallWhenBusy:shouldReject];
}

- (NSArray<NSDictionary *> *)getInitialEvents {
  return [_moduleImpl getInitialEvents];
}

- (void)clearInitialEvents {
  [_moduleImpl clearInitialEvents];
}

- (void)answerIncomingCall:(nonnull NSString *)callId
                   resolve:(nonnull RCTPromiseResolveBlock)resolve
                    reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl answerIncomingCall:callId];
  resolve(@(result));
}

- (void)displayIncomingCall:(nonnull NSString *)callId
                phoneNumber:(nonnull NSString *)phoneNumber
                 callerName:(nonnull NSString *)callerName
                   hasVideo:(BOOL)hasVideo
             displayOptions:(JS::NativeCallingx::SpecDisplayIncomingCallDisplayOptions &)displayOptions
                    resolve:(nonnull RCTPromiseResolveBlock)resolve
                     reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl displayIncomingCallWithCallId:callId
                                         phoneNumber:phoneNumber
                                          callerName:callerName
                                            hasVideo:hasVideo];
  resolve(@(result));
}

- (void)endCallWithReason:(nonnull NSString *)callId
                   reason:(double)reason
                  resolve:(nonnull RCTPromiseResolveBlock)resolve
                   reject:(nonnull RCTPromiseRejectBlock)reject {
  [CallingxImpl endCall:callId reason:(int)reason];
  resolve(@YES);
}

- (void)endCall:(nonnull NSString *)callId
        resolve:(nonnull RCTPromiseResolveBlock)resolve
         reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl endCall:callId];
  resolve(@(result));
}

- (NSNumber *)isCallRegistered:(nonnull NSString *)callId {
  return @([_moduleImpl isCallRegistered:callId]);
}

- (NSNumber *)hasRegisteredCall {
  return @([CallingxImpl hasRegisteredCall]);
}

- (void)setCurrentCallActive:(nonnull NSString *)callId
                     resolve:(nonnull RCTPromiseResolveBlock)resolve
                      reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl setCurrentCallActive:callId];
  resolve(@(result));
}

- (void)setMutedCall:(nonnull NSString *)callId
             isMuted:(BOOL)isMuted
             resolve:(nonnull RCTPromiseResolveBlock)resolve
              reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl setMutedCall:callId isMuted:isMuted];
  resolve(@(result));
}

- (void)setOnHoldCall:(nonnull NSString *)callId
             isOnHold:(BOOL)isOnHold
              resolve:(nonnull RCTPromiseResolveBlock)resolve
               reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl setOnHoldCall:callId isOnHold:isOnHold];
  resolve(@(result));
}

- (void)startCall:(nonnull NSString *)callId
      phoneNumber:(nonnull NSString *)phoneNumber
       callerName:(nonnull NSString *)callerName
         hasVideo:(BOOL)hasVideo
   displayOptions:(JS::NativeCallingx::SpecStartCallDisplayOptions &)displayOptions
          resolve:(nonnull RCTPromiseResolveBlock)resolve
           reject:(nonnull RCTPromiseRejectBlock)reject {
  [_moduleImpl startCallWithCallId:callId
                 phoneNumber:phoneNumber
                  callerName:callerName
                    hasVideo:hasVideo];
  resolve(@YES);
}

- (void)updateDisplay:(nonnull NSString *)callId
          phoneNumber:(nonnull NSString *)phoneNumber
           callerName:(nonnull NSString *)callerName
       displayOptions:(JS::NativeCallingx::SpecUpdateDisplayDisplayOptions &)displayOptions
              resolve:(nonnull RCTPromiseResolveBlock)resolve
               reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl updateDisplayWithCallId:callId
                                   phoneNumber:phoneNumber
                                    callerName:callerName];
  resolve(@(result));
}

- (void)log:(NSString *)message level:(NSString *)level {
  NSLog(@"[Callingx][log] %@, %@", message, level);
}

- (void)setupAndroid:(JS::NativeCallingx::SpecSetupAndroidOptions &)options {
  // iOS only - leave empty
}

- (void)startBackgroundTask:(NSString *)taskName
                    timeout:(double)timeout
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  // Not implemented on iOS
  resolve(@YES);
}

- (void)stopBackgroundTask:(NSString *)taskName
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
  // Not implemented on iOS
  resolve(@YES);
}

- (void)registerBackgroundTaskAvailable {
  // Not implemented on iOS - background tasks work differently on iOS
}

- (void)isServiceStarted:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject {
  // iOS doesn't use a service like Android, always return true
  resolve(@YES);
}

- (nonnull NSNumber *)canPostNotifications {
  return @YES;
}

@end
