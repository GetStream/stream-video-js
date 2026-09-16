#import "NoiseCancellationReactNative.h"

// The generated Swift header declares a subclass of RTCDefaultAudioProcessingModule, and this
// translation unit is compiled without modules, so its @import WebRTC is skipped.
#import <WebRTC/WebRTC.h>

#if __has_include("stream_io_noise_cancellation_react_native/stream_io_noise_cancellation_react_native-Swift.h")
#import "stream_io_noise_cancellation_react_native/stream_io_noise_cancellation_react_native-Swift.h"
#else
#import "stream_io_noise_cancellation_react_native-Swift.h"
#endif

@implementation NoiseCancellationReactNative {
  NoiseCancellationReactNativeImpl *_impl;
}

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [NoiseCancellationReactNativeImpl new];
  }
  return self;
}

- (void)isEnabled:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  resolve(@([_impl isEnabled]));
}

- (void)setEnabled:(BOOL)enabled
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  if (![_impl setEnabled:enabled]) {
    reject(@"NOISE_CANCELLATION_FILTER_NOT_REGISTERED", @"Noise cancellation filter not registered", nil);
    return;
  }
  resolve(@YES);
}

- (void)deviceSupportsAdvancedAudioProcessing:(RCTPromiseResolveBlock)resolve
                                       reject:(RCTPromiseRejectBlock)reject
{
  resolve(@([_impl deviceSupportsAdvancedAudioProcessing]));
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeNoiseCancellationReactNativeSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"NoiseCancellationReactNative";
}

@end
