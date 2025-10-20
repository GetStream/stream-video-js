#import "Broadcast.h"
#import <StreamReactNativeBroadcast/StreamReactNativeBroadcast-Swift.h>

@implementation Broadcast

- (NSNumber *)multiply:(double)a b:(double)b
{
    return [BroadcastSwift multiply:a b:b];
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
