#import <StreamVideoReactNativeSpec/StreamVideoReactNativeSpec.h>

@class WebRTCModule;

@interface StreamVideoReactNativeModule : NativeStreamVideoReactNativeSpecBase <NativeStreamVideoReactNativeSpec>

/// WebRTCModule of the most recently created module instance (refreshed on JS reload).
+ (nullable WebRTCModule *)currentWebRTCModule;

@end
