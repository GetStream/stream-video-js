#import "StreamInCallManagerModule.h"

#import <React/RCTInvalidating.h>
// Compiled without modules, so the Swift header's @imports are skipped; import its dependencies first.
#import <WebRTC/WebRTC.h>

#if __has_include("stream_video_react_native-Swift.h")
#import "stream_video_react_native-Swift.h"
#else
#import <stream_video_react_native/stream_video_react_native-Swift.h>
#endif

@interface StreamInCallManagerModule () <StreamInCallManagerEventEmitter, RCTInvalidating>
@end

@implementation StreamInCallManagerModule {
  StreamInCallManagerImpl *_impl;
}

@synthesize moduleRegistry = _moduleRegistry;

#pragma mark - Module Registration

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

+ (NSString *)moduleName {
  return @"StreamInCallManager";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeStreamInCallManagerSpecJSI>(params);
}

#pragma mark - Instance Lifecycle

- (instancetype)init {
  if (self = [super init]) {
    _impl = [StreamInCallManagerImpl new];
    _impl.eventEmitter = self;
    // moduleRegistry is assigned after init, so resolve WebRTCModule lazily.
    __weak StreamInCallManagerModule *weakSelf = self;
    _impl.webRTCModuleProvider = ^WebRTCModule * {
      return [weakSelf.moduleRegistry moduleForName:"WebRTCModule"];
    };
  }
  return self;
}

- (void)invalidate {
  [_impl invalidate];
}

#pragma mark - Event Emission

// The generated emitOn* calls _eventEmitterCallback without a check, and it is only set after init.
- (void)emitAudioDeviceChanged:(NSDictionary *)payload {
  if (!_eventEmitterCallback) {
    return;
  }
  [self emitOnAudioDeviceChanged:payload];
}

- (void)emitAudioInterruption:(NSDictionary *)payload {
  if (!_eventEmitterCallback) {
    return;
  }
  [self emitOnAudioInterruption:payload];
}

#pragma mark - Configuration

- (void)setAudioRole:(NSString *)role {
  [_impl setAudioRole:role];
}

- (void)setDefaultAudioDeviceEndpointType:(NSString *)type {
  [_impl setDefaultAudioDeviceEndpointType:type];
}

- (void)setTelecomManagedMode:(BOOL)enabled {
  // Android only
}

- (void)setDisableCommunicationModeWorkaround:(BOOL)disabled {
  // Android only
}

- (void)setEnableStereoAudioOutput:(BOOL)enable {
  [_impl setEnableStereoAudioOutput:enable];
}

- (void)setMuteMode:(double)mode {
  [_impl setMuteMode:(NSInteger)mode];
}

- (void)setRecordingAlwaysPreparedMode:(BOOL)enabled {
  [_impl setRecordingAlwaysPreparedMode:enabled];
}

#pragma mark - Lifecycle

- (void)setup {
  [_impl setup];
}

- (void)start {
  [_impl start];
}

- (void)stop {
  [_impl stop];
}

#pragma mark - Audio Routing

- (void)showAudioRoutePicker {
  [_impl showAudioRoutePicker];
}

- (void)getAudioDeviceStatus:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
  [_impl getAudioDeviceStatus:^(NSDictionary<NSString *, id> *status) {
    resolve(status);
  }];
}

- (void)chooseAudioDeviceEndpoint:(NSString *)deviceId {
  [_impl chooseAudioDeviceEndpoint:deviceId];
}

- (void)reapplyAudioRoute {
  [_impl reapplyAudioRoute];
}

- (void)setForceSpeakerphoneOn:(BOOL)enable {
  [_impl setForceSpeakerphoneOn:enable];
}

- (void)setMicrophoneMute:(BOOL)enable {
  [_impl setMicrophoneMute:enable];
}

#pragma mark - Debug

- (void)logAudioState {
  [_impl logAudioState];
}

- (NSString *)getAudioStateLog {
  return [_impl getAudioStateLog];
}

#pragma mark - Sounds

- (void)playSound:(NSString *)soundName playIfMuted:(BOOL)playIfMuted {
  [_impl playSound:soundName playIfMuted:playIfMuted];
}

- (void)stopSound {
  [_impl stopSound];
}

- (void)muteAudioOutput {
  [_impl muteAudioOutput];
}

- (void)unmuteAudioOutput {
  [_impl unmuteAudioOutput];
}

@end
