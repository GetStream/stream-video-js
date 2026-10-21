//
//  VideoEffectsModule.mm
//  StreamReactNativeVideoSDKSample
//
//  Created by santhosh vaiyapuri on 11/06/2024.
//
#import "VideoEffectsModule.h"
// This file is compiled without modules, so the Swift header's @imports are skipped.
// Import the Objective-C headers for the types it references first.
#import <UserNotifications/UserNotifications.h>
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "ProcessorProvider.h"
#import "StreamReactNativeVideoSDKSample-Swift.h"

@implementation VideoEffectsModule {
  VideoEffectsModuleImpl *_impl;
}

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [VideoEffectsModuleImpl new];
  }
  return self;
}

- (NSNumber *)registerVideoFilters
{
  [_impl registerVideoFilters];
  return @YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeVideoEffectsModuleSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"VideoEffectsModule";
}

@end
