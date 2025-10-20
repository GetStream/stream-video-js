#import "Broadcast.h"
#import <StreamReactNativeBroadcast/StreamReactNativeBroadcast-Swift.h>

@implementation Broadcast

- (void)multiply:(double)a b:(double)b resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
    [BroadcastSwift multiply:a b:b completion:^(NSNumber * _Nullable result, NSError * _Nullable error) {
        if (error != nil) {
            reject(@"multiply_error", error.localizedDescription, error);
        } else {
            resolve(result);
        }
    }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBroadcastSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"Broadcast";
}

@end
