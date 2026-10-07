#import "VideoFiltersReactNative.h"

// The generated Swift header declares a VideoFrameProcessorDelegate conformance, and this
// translation unit is compiled without modules, so its @import lines are skipped.
// ProcessorProvider.h declares that protocol and imports the WebRTC types it uses.
#import "ProcessorProvider.h"

#if __has_include("stream_io_video_filters_react_native/stream_io_video_filters_react_native-Swift.h")
#import "stream_io_video_filters_react_native/stream_io_video_filters_react_native-Swift.h"
#else
#import "stream_io_video_filters_react_native-Swift.h"
#endif

@implementation VideoFiltersReactNative {
  VideoFiltersReactNativeImpl *_impl;
}

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [VideoFiltersReactNativeImpl new];
  }
  return self;
}

- (NSNumber *)registerBackgroundBlurVideoFilters
{
  [_impl registerBackgroundBlurVideoFilters];
  return @YES;
}

- (NSNumber *)registerVirtualBackgroundFilter:(NSString *)backgroundImageUrlString
{
  [_impl registerVirtualBackgroundFilter:backgroundImageUrlString];
  return @YES;
}

- (NSNumber *)registerBlurVideoFilters
{
  [_impl registerBlurVideoFilters];
  return @YES;
}

- (NSNumber *)unregisterAllFilters
{
  [_impl unregisterAllFilters];
  return @YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeVideoFiltersReactNativeSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"VideoFiltersReactNative";
}

@end
