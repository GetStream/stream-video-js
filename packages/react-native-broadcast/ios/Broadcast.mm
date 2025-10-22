#import "Broadcast.h"
#import <StreamReactNativeBroadcast/StreamReactNativeBroadcast-Swift.h>

@implementation Broadcast

- (void)start:(NSString *)endpoint streamName:(NSString *)streamName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
    [BroadcastManager startWithEndpoint:endpoint streamName:streamName completion:^(NSError * _Nullable error) {
        if (error != nil) {
            reject(@"start_error", error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    }];
}

- (void)stop:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
    [BroadcastManager stopWithCompletion:^(NSError * _Nullable error) {
        if (error != nil) {
            reject(@"stop_error", error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    }];
}

- (void)setCameraDirection:(NSString *)direction
{
    [BroadcastManager setCameraDirectionWithDirection:direction];
}

- (void)setCameraEnabled:(BOOL)enabled
{
    [BroadcastManager setCameraEnabledWithEnabled:enabled];
}

- (void)setMicrophoneEnabled:(BOOL)enabled
{
    [BroadcastManager setMicrophoneEnabledWithEnabled:enabled];
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
