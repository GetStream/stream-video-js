#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VideoFiltersReactNative, NSObject)

RCT_EXTERN_METHOD(registerBackgroundBlurVideoFilters:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(registerVirtualBackgroundFilter:(NSString *)backgroundImageUrlString
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
