#import "Broadcast.h"
#import <StreamReactNativeBroadcast/StreamReactNativeBroadcast-Swift.h>

@implementation Broadcast

- (void)start:(NSString *)endpoint streamName:(NSString *)streamName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
    [BroadcastSwift startWithEndpoint:endpoint streamName:streamName completion:^(NSError * _Nullable error) {
        if (error != nil) {
            reject(@"start_error", error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    }];
}

- (void)stop:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
    [BroadcastSwift stopWithCompletion:^(NSError * _Nullable error) {
        if (error != nil) {
            reject(@"stop_error", error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    }];
}

- (void)setCameraDirection:(NSString *)direction
{
    [BroadcastSwift setCameraDirectionWithDirection:direction];
}

- (void)setCameraEnabled:(BOOL)enabled
{
    [BroadcastSwift setCameraEnabledWithEnabled:enabled];
}

- (void)setMicrophoneEnabled:(BOOL)enabled
{
    [BroadcastSwift setMicrophoneEnabledWithEnabled:enabled];
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
