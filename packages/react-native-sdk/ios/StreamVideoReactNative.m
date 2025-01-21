#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "StreamVideoReactNative.h"
#import "WebRTCModule.h"
#import "WebRTCModuleOptions.h"

// Do not change these consts, it is what is used react-native-webrtc
NSNotificationName const kBroadcastStartedNotification = @"iOS_BroadcastStarted";
NSNotificationName const kBroadcastStoppedNotification = @"iOS_BroadcastStopped";
NSMutableDictionary *dictionary;

void broadcastNotificationCallback(CFNotificationCenterRef center,
                                   void *observer,
                                   CFStringRef name,
                                   const void *object,
                                   CFDictionaryRef userInfo) {
    StreamVideoReactNative *this = (__bridge StreamVideoReactNative*)observer;
    NSString *eventName = (__bridge NSString*)name;
    [this screenShareEventReceived: eventName];

}

@implementation StreamVideoReactNative
{
    bool hasListeners;
    CFNotificationCenterRef _notificationCenter;
}
RCT_EXPORT_MODULE();

+(BOOL)requiresMainQueueSetup {
    return NO;
}

+(void)setup {
    // RTCDefaultVideoEncoderFactory *videoEncoderFactory = [[RTCDefaultVideoEncoderFactory alloc] init];
    // RTCVideoEncoderFactorySimulcast *simulcastVideoEncoderFactory = [[RTCVideoEncoderFactorySimulcast alloc] initWithPrimary:videoEncoderFactory fallback:videoEncoderFactory];
    // WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
    // options.videoEncoderFactory = simulcastVideoEncoderFactory;
}

-(instancetype)init {
    self = [super init];
    if (self) {
        _notificationCenter = CFNotificationCenterGetDarwinNotifyCenter();
        [self setupObserver];
    }
    if (self) {
        [UIDevice currentDevice].batteryMonitoringEnabled = YES;
    }

    return self;
}

RCT_EXPORT_METHOD(isLowPowerModeEnabled:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@([NSProcessInfo processInfo].lowPowerModeEnabled));
}

RCT_EXPORT_METHOD(currentThermalState:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    NSInteger thermalState = [NSProcessInfo processInfo].thermalState;
    NSString *thermalStateString = [self stringForThermalState:thermalState];
    resolve(thermalStateString);
}

-(void)dealloc {
    [self clearObserver];
}


-(void)setupObserver {
    CFNotificationCenterAddObserver(_notificationCenter,
                                    (__bridge const void *)(self),
                                    broadcastNotificationCallback,
                                    (__bridge CFStringRef)kBroadcastStartedNotification,
                                    NULL,
                                    CFNotificationSuspensionBehaviorDeliverImmediately);
    CFNotificationCenterAddObserver(_notificationCenter,
                                    (__bridge const void *)(self),
                                    broadcastNotificationCallback,
                                    (__bridge CFStringRef)kBroadcastStoppedNotification,
                                    NULL,
                                    CFNotificationSuspensionBehaviorDeliverImmediately);
}

-(void)clearObserver {
    CFNotificationCenterRemoveObserver(_notificationCenter,
                                       (__bridge const void *)(self),
                                       (__bridge CFStringRef)kBroadcastStartedNotification,
                                       NULL);
    CFNotificationCenterRemoveObserver(_notificationCenter,
                                       (__bridge const void *)(self),
                                       (__bridge CFStringRef)kBroadcastStoppedNotification,
                                       NULL);
}

-(void)startObserving {
    hasListeners = YES;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(powerModeDidChange)
                                                 name:NSProcessInfoPowerStateDidChangeNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(thermalStateDidChange)
                                                 name:NSProcessInfoThermalStateDidChangeNotification
                                               object:nil];
}

-(void)stopObserving {
    hasListeners = NO;
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:NSProcessInfoPowerStateDidChangeNotification
                                                  object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:NSProcessInfoThermalStateDidChangeNotification
                                                  object:nil];
}

- (void)powerModeDidChange {
    if (!hasListeners) {
        return;
    }
    BOOL lowPowerEnabled = [NSProcessInfo processInfo].lowPowerModeEnabled;
    [self sendEventWithName:@"isLowPowerModeEnabled" body:@(lowPowerEnabled)];
}

- (void)thermalStateDidChange {
    if (!hasListeners) {
        return;
    }
    NSInteger thermalState = [NSProcessInfo processInfo].thermalState;
    NSString *thermalStateString = [self stringForThermalState:thermalState];
    [self sendEventWithName:@"thermalStateDidChange" body:thermalStateString];
}

- (NSString *)stringForThermalState:(NSInteger)thermalState {
    switch (thermalState) {
        case NSProcessInfoThermalStateNominal:
            return @"NOMINAL";
        case NSProcessInfoThermalStateFair:
            return @"FAIR";
        case NSProcessInfoThermalStateSerious:
            return @"SERIOUS";
        case NSProcessInfoThermalStateCritical:
            return @"CRITICAL";
        default:
            return @"UNSPECIFIED";
    }
}

-(void)screenShareEventReceived:(NSString*)event {
    if (hasListeners) {
        [self sendEventWithName:@"StreamVideoReactNative_Ios_Screenshare_Event" body:@{@"name": event}];
    }
}

+(void)registerIncomingCall:(NSString *)cid uuid:(NSString *)uuid {
    if (dictionary == nil) {
       dictionary = [NSMutableDictionary dictionary];
    }
    dictionary[cid] = uuid;
}

RCT_EXPORT_METHOD(getIncomingCallUUid:(NSString *)cid
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (dictionary == nil) {
        reject(@"access_failure", @"no incoming call dictionary found", nil);
    }
    NSString *uuid = dictionary[cid];
    if (uuid) {
       resolve(uuid);
     } else {
        reject(@"access_failure", @"requested incoming call found", nil);
     }

}

-(NSArray<NSString *> *)supportedEvents {
    return @[@"StreamVideoReactNative_Ios_Screenshare_Event", @"isLowPowerModeEnabled", @"thermalStateDidChange"];
}

@end
