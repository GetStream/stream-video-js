#ifdef RCT_NEW_ARCH_ENABLED
#import <CallingxSpec/CallingxSpec.h>
#endif

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTBridge+Private.h>

#import <AVFoundation/AVAudioSession.h>
#import <CallKit/CallKit.h>
#import "WebRTCModule.h"

// Import Swift generated header
#if __has_include("Callingx-Swift.h")
#import "Callingx-Swift.h"
#else
#import <Callingx/Callingx-Swift.h>
#endif

// MARK: - Callingx Interface

#ifdef RCT_NEW_ARCH_ENABLED
@interface Callingx : NativeCallingxSpecBase<NativeCallingxSpec, CallingxEventEmitter, VoipNotificationsEventEmitter>
#else
@interface Callingx : RCTEventEmitter <RCTBridgeModule, CallingxEventEmitter, VoipNotificationsEventEmitter>
#endif

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

#pragma mark - Module Registration

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

#ifdef RCT_NEW_ARCH_ENABLED
+ (NSString *)moduleName {
  return @"Callingx";
}
#else
RCT_EXPORT_MODULE(Callingx)
#endif

#pragma mark - Class Methods (Public API)

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

+ (void)endCall:(NSString *)callId reason:(int)reason {
  [CallingxImpl endCall:callId reason:reason];
}

#pragma mark - Instance Lifecycle

- (instancetype)init {
  if (self = [super init]) {
    _moduleImpl = [[CallingxImpl alloc] init];
    _moduleImpl.eventEmitter = self;

    [VoipNotificationsManager shared].eventEmitter = self;
  }
  return self;
}

- (void)dealloc {
  _moduleImpl = nil;
}

#pragma mark - Old Arch Event Support

#ifndef RCT_NEW_ARCH_ENABLED
- (NSArray<NSString *> *)supportedEvents {
  return @[@"onNewEvent", @"onNewVoipEvent"];
}
#endif

#pragma mark - Turbo Module (New Arch Only)

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeCallingxSpecJSI>(params);
}
#endif

#pragma mark - Event Emission

- (void)emitEvent:(NSDictionary *)dictionary {
#ifdef RCT_NEW_ARCH_ENABLED
  [self emitOnNewEvent:dictionary];
#else
  [self sendEventWithName:@"onNewEvent" body:dictionary];
#endif
}

- (void)emitVoipEvent:(NSDictionary *)dictionary {
#ifdef RCT_NEW_ARCH_ENABLED
  [self emitOnNewVoipEvent:dictionary];
#else
  [self sendEventWithName:@"onNewVoipEvent" body:dictionary];
#endif
}

#pragma mark - Internal Helpers

- (void)_setupiOSWithOptions:(NSDictionary *)optionsDict {
  [_moduleImpl setupWithOptions:optionsDict];

  // Inject WebRTCModule so CallingxImpl can access AudioDeviceModule.
  // self.bridge is NOT available on TurboModules — use currentBridge instead,
  // which returns the real RCTBridge or RCTBridgeProxy (bridgeless interop).
  WebRTCModule *webrtcModule = [[RCTBridge currentBridge] moduleForName:@"WebRTCModule"];
  _moduleImpl.webRTCModule = webrtcModule;

  self.callKeepCallController = _moduleImpl.callKeepCallController;
  self.callKeepProvider = _moduleImpl.callKeepProvider;
}

#pragma mark - setupiOS

#ifdef RCT_NEW_ARCH_ENABLED
- (void)setupiOS:(JS::NativeCallingx::SpecSetupiOSOptions &)options {
  NSDictionary *optionsDict = @{
    @"supportsVideo" : @(options.supportsVideo()),
    @"maximumCallsPerCallGroup" : @(options.maximumCallsPerCallGroup()),
    @"maximumCallGroups" : @(options.maximumCallGroups()),
    @"handleType" : options.handleType(),
    @"ringtoneSound" : options.sound(),
    @"imageName" : options.imageName(),
    @"includesCallsInRecents" : @(options.callsHistory()),
    @"displayCallTimeout" : @(options.displayCallTimeout())
  };
  
  [self _setupiOSWithOptions:optionsDict];
}
#else
RCT_EXPORT_METHOD(setupiOS:(NSDictionary *)options) {
  NSDictionary *optionsDict = @{
    @"supportsVideo" : options[@"supportsVideo"] ?: @(NO),
    @"maximumCallsPerCallGroup" : options[@"maximumCallsPerCallGroup"] ?: @(1),
    @"maximumCallGroups" : options[@"maximumCallGroups"] ?: @(1),
    @"handleType" : options[@"handleType"] ?: @"generic",
    @"ringtoneSound" : options[@"sound"] ?: @"",
    @"imageName" : options[@"imageName"] ?: @"",
    @"includesCallsInRecents" : options[@"callsHistory"] ?: @(NO),
    @"displayCallTimeout" : options[@"displayCallTimeout"] ?: @(0)
  };

  [self _setupiOSWithOptions:optionsDict];
}
#endif

#pragma mark - setupAndroid

#ifdef RCT_NEW_ARCH_ENABLED
- (void)setupAndroid:(JS::NativeCallingx::SpecSetupAndroidOptions &)options {
  // iOS only - leave empty
}
#else
RCT_EXPORT_METHOD(setupAndroid:(NSDictionary *)options) {
  // iOS only - leave empty
}
#endif

#pragma mark - setShouldRejectCallWhenBusy

#ifdef RCT_NEW_ARCH_ENABLED
- (void)setShouldRejectCallWhenBusy:(BOOL)shouldReject {
  [Settings setShouldRejectCallWhenBusy:shouldReject];
}
#else
RCT_EXPORT_METHOD(setShouldRejectCallWhenBusy:(BOOL)shouldReject) {
  [Settings setShouldRejectCallWhenBusy:shouldReject];
}
#endif

#pragma mark - getInitialEvents

#ifdef RCT_NEW_ARCH_ENABLED
- (NSArray<NSDictionary *> *)getInitialEvents {
  return [_moduleImpl getInitialEvents];
}
#else
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getInitialEvents) {
  return [_moduleImpl getInitialEvents];
}
#endif

#pragma mark - getInitialVoipEvents

#ifdef RCT_NEW_ARCH_ENABLED
- (NSArray<NSDictionary *> *)getInitialVoipEvents {
  return [[VoipNotificationsManager shared] getInitialEvents];
}
#else
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getInitialVoipEvents) {
  return [[VoipNotificationsManager shared] getInitialEvents];
}
#endif

#pragma mark - registerVoipToken

#ifdef RCT_NEW_ARCH_ENABLED
- (void)registerVoipToken {
  [[VoipNotificationsManager shared] registerVoipToken];
}
#else
RCT_EXPORT_METHOD(registerVoipToken) {
  [[VoipNotificationsManager shared] registerVoipToken];
}
#endif

#pragma mark - answerIncomingCall

#ifdef RCT_NEW_ARCH_ENABLED
- (void)answerIncomingCall:(nonnull NSString *)callId
                   resolve:(nonnull RCTPromiseResolveBlock)resolve
                    reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl answerIncomingCall:callId];
  resolve(@(result));
}
#else
RCT_EXPORT_METHOD(answerIncomingCall:(NSString *)callId
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject) {
  BOOL result = [_moduleImpl answerIncomingCall:callId];
  resolve(@(result));
}
#endif

#pragma mark - displayIncomingCall

#ifdef RCT_NEW_ARCH_ENABLED
- (void)displayIncomingCall:(nonnull NSString *)callId
                phoneNumber:(nonnull NSString *)phoneNumber
                 callerName:(nonnull NSString *)callerName
                   hasVideo:(BOOL)hasVideo
             displayOptions:(JS::NativeCallingx::SpecDisplayIncomingCallDisplayOptions &)displayOptions
                    resolve:(nonnull RCTPromiseResolveBlock)resolve
                     reject:(nonnull RCTPromiseRejectBlock)reject {
  [_moduleImpl displayIncomingCallWithCallId:callId
                                 phoneNumber:phoneNumber
                                  callerName:callerName
                                    hasVideo:hasVideo
                                     resolve:resolve
                                      reject:reject
  ];
}
#else
RCT_EXPORT_METHOD(displayIncomingCall:(NSString *)callId
                phoneNumber:(NSString *)phoneNumber
                 callerName:(NSString *)callerName
                   hasVideo:(BOOL)hasVideo
             displayOptions:(NSDictionary *)displayOptions
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject) {
  [_moduleImpl displayIncomingCallWithCallId:callId
                                 phoneNumber:phoneNumber
                                  callerName:callerName
                                    hasVideo:hasVideo
                                     resolve:resolve
                                      reject:reject
  ];
}
#endif

#pragma mark - endCallWithReason

#ifdef RCT_NEW_ARCH_ENABLED
- (void)endCallWithReason:(nonnull NSString *)callId
                   reason:(double)reason
                  resolve:(nonnull RCTPromiseResolveBlock)resolve
                   reject:(nonnull RCTPromiseRejectBlock)reject {
  [CallingxImpl endCall:callId reason:(int)reason];
  resolve(@YES);
}
#else
RCT_EXPORT_METHOD(endCallWithReason:(NSString *)callId
                   reason:(double)reason
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
  [CallingxImpl endCall:callId reason:(int)reason];
  resolve(@YES);
}
#endif

#pragma mark - endCall

#ifdef RCT_NEW_ARCH_ENABLED
- (void)endCall:(nonnull NSString *)callId
        resolve:(nonnull RCTPromiseResolveBlock)resolve
         reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl endCall:callId];
  resolve(@(result));
}
#else
RCT_EXPORT_METHOD(endCall:(NSString *)callId
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject) {
  BOOL result = [_moduleImpl endCall:callId];
  resolve(@(result));
}
#endif

#pragma mark - isCallRegistered

#ifdef RCT_NEW_ARCH_ENABLED
- (NSNumber *)isCallTracked:(nonnull NSString *)callId {
  return @([_moduleImpl isCallTracked:callId]);
}
#else
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isCallTracked:(NSString *)callId) {
  return @([_moduleImpl isCallTracked:callId]);
}
#endif

#pragma mark - hasRegisteredCall

#ifdef RCT_NEW_ARCH_ENABLED
- (NSNumber *)hasRegisteredCall {
  return @([CallingxImpl hasRegisteredCall]);
}
#else
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(hasRegisteredCall) {
  return @([CallingxImpl hasRegisteredCall]);
}
#endif

#pragma mark - setCurrentCallActive

#ifdef RCT_NEW_ARCH_ENABLED
- (void)setCurrentCallActive:(nonnull NSString *)callId
                     resolve:(nonnull RCTPromiseResolveBlock)resolve
                      reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl setCurrentCallActive:callId];
  resolve(@(result));
}
#else
RCT_EXPORT_METHOD(setCurrentCallActive:(NSString *)callId
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject) {
  BOOL result = [_moduleImpl setCurrentCallActive:callId];
  resolve(@(result));
}
#endif

#pragma mark - setMutedCall

#ifdef RCT_NEW_ARCH_ENABLED
- (void)setMutedCall:(nonnull NSString *)callId
             isMuted:(BOOL)isMuted
             resolve:(nonnull RCTPromiseResolveBlock)resolve
              reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl setMutedCall:callId isMuted:isMuted];
  resolve(@(result));
}
#else
RCT_EXPORT_METHOD(setMutedCall:(NSString *)callId
             isMuted:(BOOL)isMuted
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject) {
  BOOL result = [_moduleImpl setMutedCall:callId isMuted:isMuted];
  resolve(@(result));
}
#endif

#pragma mark - setOnHoldCall

#ifdef RCT_NEW_ARCH_ENABLED
- (void)setOnHoldCall:(nonnull NSString *)callId
             isOnHold:(BOOL)isOnHold
              resolve:(nonnull RCTPromiseResolveBlock)resolve
               reject:(nonnull RCTPromiseRejectBlock)reject {
  BOOL result = [_moduleImpl setOnHoldCall:callId isOnHold:isOnHold];
  resolve(@(result));
}
#else
RCT_EXPORT_METHOD(setOnHoldCall:(NSString *)callId
             isOnHold:(BOOL)isOnHold
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject) {
  BOOL result = [_moduleImpl setOnHoldCall:callId isOnHold:isOnHold];
  resolve(@(result));
}
#endif

#pragma mark - startCall

#ifdef RCT_NEW_ARCH_ENABLED
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
#else
RCT_EXPORT_METHOD(startCall:(NSString *)callId
      phoneNumber:(NSString *)phoneNumber
       callerName:(NSString *)callerName
         hasVideo:(BOOL)hasVideo
   displayOptions:(NSDictionary *)displayOptions
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject) {
  [_moduleImpl startCallWithCallId:callId
                 phoneNumber:phoneNumber
                  callerName:callerName
                    hasVideo:hasVideo];
  resolve(@YES);
}
#endif

#pragma mark - updateDisplay

#ifdef RCT_NEW_ARCH_ENABLED
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
#else
RCT_EXPORT_METHOD(updateDisplay:(NSString *)callId
          phoneNumber:(NSString *)phoneNumber
           callerName:(NSString *)callerName
       displayOptions:(NSDictionary *)displayOptions
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject) {
  BOOL result = [_moduleImpl updateDisplayWithCallId:callId
                                   phoneNumber:phoneNumber
                                    callerName:callerName];
  resolve(@(result));
}
#endif

#pragma mark - log

#ifdef RCT_NEW_ARCH_ENABLED
- (void)log:(NSString *)message level:(NSString *)level {
  NSLog(@"[Callingx][log] %@, %@", message, level);
}
#else
RCT_EXPORT_METHOD(log:(NSString *)message level:(NSString *)level) {
  NSLog(@"[Callingx][log] %@, %@", message, level);
}
#endif

#pragma mark - startBackgroundTask

#ifdef RCT_NEW_ARCH_ENABLED
- (void)startBackgroundTask:(NSString *)taskName
                    timeout:(double)timeout
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  // Not implemented on iOS
  resolve(@YES);
}
#else
RCT_EXPORT_METHOD(startBackgroundTask:(NSString *)taskName
                    timeout:(double)timeout
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject) {
  // Not implemented on iOS
  resolve(@YES);
}
#endif

#pragma mark - stopBackgroundTask

#ifdef RCT_NEW_ARCH_ENABLED
- (void)stopBackgroundTask:(NSString *)taskName
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
  // Not implemented on iOS
  resolve(@YES);
}
#else
RCT_EXPORT_METHOD(stopBackgroundTask:(NSString *)taskName
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject) {
  // Not implemented on iOS
  resolve(@YES);
}
#endif

#pragma mark - registerBackgroundTaskAvailable

#ifdef RCT_NEW_ARCH_ENABLED
- (void)registerBackgroundTaskAvailable {
  // Not implemented on iOS - background tasks work differently on iOS
}
#else
RCT_EXPORT_METHOD(registerBackgroundTaskAvailable) {
  // Not implemented on iOS - background tasks work differently on iOS
}
#endif

#pragma mark - isServiceStarted

#ifdef RCT_NEW_ARCH_ENABLED
- (void)isServiceStarted:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject {
  // iOS doesn't use a service like Android, always return true
  resolve(@YES);
}
#else
RCT_EXPORT_METHOD(isServiceStarted:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  // iOS doesn't use a service like Android, always return true
  resolve(@YES);
}
#endif

#pragma mark - canPostNotifications

#ifdef RCT_NEW_ARCH_ENABLED
- (nonnull NSNumber *)canPostNotifications {
  return @YES;
}
#else
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(canPostNotifications) {
  return @YES;
}
#endif

@end
