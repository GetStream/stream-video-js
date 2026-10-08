#import "StreamVideoReactNativeModule.h"

#import <React/RCTInvalidating.h>

#import "StreamVideoReactNativeLegacyImpl.h"
// Compiled without modules, so the Swift header's @imports are skipped; import its dependencies first.
#import <WebRTC/WebRTC.h>

#if __has_include("stream_video_react_native-Swift.h")
#import "stream_video_react_native-Swift.h"
#else
#import <stream_video_react_native/stream_video_react_native-Swift.h>
#endif

static NSString *const kUnsupportedPlatform = @"UNSUPPORTED_PLATFORM";

static __weak StreamVideoReactNativeModule *sCurrentModule = nil;

@interface StreamVideoReactNativeModule () <StreamVideoReactNativeEventEmitter, RCTInvalidating>
@end

@implementation StreamVideoReactNativeModule {
  StreamVideoReactNativeImpl *_impl;
  StreamVideoReactNativeLegacyImpl *_legacyImpl;
}

@synthesize moduleRegistry = _moduleRegistry;
@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;

#pragma mark - Module Registration

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

+ (NSString *)moduleName {
  return @"StreamVideoReactNative";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeStreamVideoReactNativeSpecJSI>(params);
}

+ (WebRTCModule *)currentWebRTCModule {
  return [sCurrentModule.moduleRegistry moduleForName:"WebRTCModule"];
}

#pragma mark - Instance Lifecycle

- (instancetype)init {
  if (self = [super init]) {
    _impl = [StreamVideoReactNativeImpl new];
    _impl.eventEmitter = self;
    // moduleRegistry and viewRegistry_DEPRECATED are assigned after init, so resolve them lazily.
    __weak StreamVideoReactNativeModule *weakSelf = self;
    _impl.viewRegistryProvider = ^RCTViewRegistry * {
      return weakSelf.viewRegistry_DEPRECATED;
    };
    _legacyImpl = [StreamVideoReactNativeLegacyImpl new];
    _legacyImpl.webRTCModuleProvider = ^WebRTCModule * {
      return [weakSelf.moduleRegistry moduleForName:"WebRTCModule"];
    };
    sCurrentModule = self;
  }
  return self;
}

- (void)invalidate {
  [_impl invalidate];
  [_legacyImpl invalidate];
}

#pragma mark - Event Emission

// The generated emitOn* calls _eventEmitterCallback without a check, and it is only set after init.
- (void)emitScreenShareEvent:(NSDictionary<NSString *, id> *)payload {
  if (!_eventEmitterCallback) {
    return;
  }
  [self emitOnScreenShareEvent:payload];
}

- (void)emitLowPowerModeChanged:(BOOL)enabled {
  if (!_eventEmitterCallback) {
    return;
  }
  [self emitOnLowPowerModeChanged:enabled];
}

- (void)emitThermalStateChanged:(NSString *)state {
  if (!_eventEmitterCallback) {
    return;
  }
  [self emitOnThermalStateChanged:state];
}

- (void)emitChargingStateChanged:(NSDictionary<NSString *, id> *)payload {
  if (!_eventEmitterCallback) {
    return;
  }
  [self emitOnChargingStateChanged:payload];
}

#pragma mark - Device State

- (NSNumber *)isLowPowerModeEnabled {
  return @([_impl isLowPowerModeEnabled]);
}

- (NSString *)currentThermalState {
  return [_impl currentThermalState];
}

- (NSDictionary *)getBatteryState {
  return [_impl getBatteryState];
}

- (void)startThermalStatusUpdates {
  // Android only
}

- (void)stopThermalStatusUpdates {
  // Android only
}

#pragma mark - Android-only Stubs

- (NSString *)getDefaultRingtoneUrl {
  return nil;
}

- (NSNumber *)isInPiPMode {
  return @NO;
}

- (NSNumber *)isCallAliveConfigured {
  return @NO;
}

- (NSNumber *)hasAudioOutputHardware {
  return @NO;
}

- (NSNumber *)hasMicrophoneHardware {
  return @NO;
}

- (NSNumber *)hasCameraHardware {
  return @NO;
}

- (void)canAutoEnterPipMode:(BOOL)value {
  // Android only
}

- (void)startKeepCallAliveService:(NSString *)callCid
                        channelId:(NSString *)channelId
                      channelName:(NSString *)channelName
                            title:(NSString *)title
                             body:(NSString *)body
                    smallIconName:(NSString *)smallIconName
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject {
  reject(kUnsupportedPlatform, @"startKeepCallAliveService is only supported on Android", nil);
}

- (void)stopKeepCallAliveService:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject {
  reject(kUnsupportedPlatform, @"stopKeepCallAliveService is only supported on Android", nil);
}

- (void)exitPipMode:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  reject(kUnsupportedPlatform, @"exitPipMode is only supported on Android", nil);
}

- (void)takeScreenshot:(NSString *)streamURL
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
  reject(kUnsupportedPlatform, @"takeScreenshot is only supported on Android", nil);
}

#pragma mark - Screenshots & Permissions

- (void)captureRef:(double)reactTag
           options:(NSDictionary *)options
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  [_impl captureRef:@(reactTag) options:options resolve:resolve reject:reject];
}

- (void)checkPermission:(NSString *)permission
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
  [_impl checkPermission:permission resolve:resolve reject:reject];
}

#pragma mark - Busy Tone

- (void)playBusyTone:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl playBusyTone:resolve reject:reject];
}

- (void)stopBusyTone:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl stopBusyTone:resolve reject:reject];
}

#pragma mark - Screen Share

- (void)startInAppScreenCapture:(BOOL)includeAudio
                        resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl startInAppScreenCapture:includeAudio resolve:resolve reject:reject];
}

- (void)stopInAppScreenCapture:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl stopInAppScreenCapture:resolve reject:reject];
}

- (void)startScreenShareAudioMixing:(RCTPromiseResolveBlock)resolve
                             reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl startScreenShareAudioMixing:resolve reject:reject];
}

- (void)stopScreenShareAudioMixing:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl stopScreenShareAudioMixing:resolve reject:reject];
}

#pragma mark - Track Recording

- (void)startTrackRecording:(JS::NativeStreamVideoReactNative::SpecStartTrackRecordingOptions &)options
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl startTrackRecordingWithVideoTrackId:options.videoTrackId()
                               maxDurationMs:(NSInteger)options.maxDurationMs().value_or(5000)
                                 targetWidth:(NSInteger)options.targetWidth().value_or(0)
                                targetHeight:(NSInteger)options.targetHeight().value_or(0)
                                     resolve:resolve
                                      reject:reject];
}

- (void)stopTrackRecording:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl stopTrackRecording:resolve reject:reject];
}

- (void)clearStreamRecordings:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl clearStreamRecordings:resolve reject:reject];
}

- (void)getStreamRecordings:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_legacyImpl getStreamRecordings:resolve reject:reject];
}

@end
