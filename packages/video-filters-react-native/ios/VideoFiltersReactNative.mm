#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VideoFiltersReactNative, NSObject)

RCT_EXTERN_METHOD(multiply:(float)a withB:(float)b
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(registerBackgroundBlurVideoFilters)

RCT_EXTERN_METHOD(registerVirtualBackgroundFilter:(NSString *)backgroundImageUrlString)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
