#import "Broadcast.h"
#import <StreamReactNativeBroadcast/StreamReactNativeBroadcast-Swift.h>

@implementation Broadcast


- (NSString *)createInstance
{
    return [BroadcastManager createInstance];
}

- (void)destroyInstance:(NSString *)instanceId
{
    [BroadcastManager destroyInstanceWithInstanceId:instanceId];
}

- (void)start:(NSString *)instanceId endpoint:(NSString *)endpoint streamName:(NSString *)streamName resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
    [BroadcastManager startWithInstanceId:instanceId endpoint:endpoint streamName:streamName completion:^(NSError * _Nullable error) {
        if (error != nil) {
            reject(@"start_error", error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    }];
}

- (void)stop:(NSString *)instanceId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
    [BroadcastManager stopWithInstanceId:instanceId completion:^(NSError * _Nullable error) {
        if (error != nil) {
            reject(@"stop_error", error.localizedDescription, error);
        } else {
            resolve(nil);
        }
    }];
}

- (void)setCameraDirection:(NSString *)instanceId direction:(NSString *)direction
{
    [BroadcastManager setCameraDirectionWithInstanceId:instanceId direction:direction];
}

- (void)setCameraEnabled:(NSString *)instanceId enabled:(BOOL)enabled
{
    [BroadcastManager setCameraEnabledWithInstanceId:instanceId enabled:enabled];
}

- (void)setMicrophoneEnabled:(NSString *)instanceId enabled:(BOOL)enabled
{
    [BroadcastManager setMicrophoneEnabledWithInstanceId:instanceId enabled:enabled];
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
