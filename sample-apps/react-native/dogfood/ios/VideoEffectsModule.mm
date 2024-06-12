//
//  VideoEffectsModule.mm
//  StreamReactNativeVideoSDKSample
//
//  Created by santhosh vaiyapuri on 11/06/2024.
//
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VideoEffectsModule, NSObject)

RCT_EXTERN_METHOD(registerVideoFilters:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
