#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "StreamVideoReactNative.h"
#import "WebRTCModule.h"
#import "WebRTCModuleOptions.h"

// Do not change these consts, it is what is used react-native-webrtc
NSNotificationName const kBroadcastStartedNotification = @"iOS_BroadcastStarted";
NSNotificationName const kBroadcastStoppedNotification = @"iOS_BroadcastStopped";

static NSMutableDictionary *_incomingCallUUIDsByCallID = nil;
static NSMutableDictionary *_incomingCallCidsByUUID = nil;
static dispatch_queue_t _dictionaryQueue = nil;

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

+(void)initializeSharedDictionaries {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _dictionaryQueue = dispatch_queue_create("com.stream.video.dictionary", DISPATCH_QUEUE_SERIAL);
        _incomingCallUUIDsByCallID = [NSMutableDictionary dictionary];
        _incomingCallCidsByUUID = [NSMutableDictionary dictionary];
    });
}

-(instancetype)init {
    if ((self = [super init])) {
        _notificationCenter = CFNotificationCenterGetDarwinNotifyCenter();
        [UIDevice currentDevice].batteryMonitoringEnabled = YES;
        [self setupObserver];
        [StreamVideoReactNative initializeSharedDictionaries];
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
    [StreamVideoReactNative initializeSharedDictionaries];
    dispatch_sync(_dictionaryQueue, ^{
        
#ifdef DEBUG
        NSLog(@"registerIncomingCall cid:%@ -> uuid:%@",cid,uuid);
#endif
        NSString *lowercaseUUID = [uuid lowercaseString];
        _incomingCallUUIDsByCallID[cid] = lowercaseUUID;
        _incomingCallCidsByUUID[lowercaseUUID] = cid;
    });
}

RCT_EXPORT_METHOD(getIncomingCallUUid:(NSString *)cid
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_sync(_dictionaryQueue, ^{
        NSString *uuid = _incomingCallUUIDsByCallID[cid];
        if (uuid) {
            resolve(uuid);
        } else {
            NSString *errorString = [NSString stringWithFormat:@"requested incoming call not found for cid: %@", cid];
            reject(@"access_failure", errorString, nil);
        }
    });
}

RCT_EXPORT_METHOD(getIncomingCallCid:(NSString *)uuid
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_sync(_dictionaryQueue, ^{
        NSString *lowercaseUUID = [uuid lowercaseString];
        NSString *foundCid = _incomingCallCidsByUUID[lowercaseUUID];
        
        if (foundCid) {
            resolve(foundCid);
        } else {
            NSString *errorString = [NSString stringWithFormat:@"requested incoming call not found for uuid: %@", uuid];
            reject(@"access_failure", errorString, nil);
        }
    });
}

RCT_EXPORT_METHOD(removeIncomingCall:(NSString *)cid
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_sync(_dictionaryQueue, ^{
        NSString *uuid = _incomingCallUUIDsByCallID[cid];
        if (uuid) {
#ifdef DEBUG
            NSLog(@"removeIncomingCall cid:%@ -> uuid:%@",cid,uuid);
#endif
            
            [_incomingCallUUIDsByCallID removeObjectForKey:cid];
            [_incomingCallCidsByUUID removeObjectForKey:uuid];
            resolve(@YES);
        } else {
            resolve(@NO);
        }
    });
}

-(NSArray<NSString *> *)supportedEvents {
    return @[@"StreamVideoReactNative_Ios_Screenshare_Event", @"isLowPowerModeEnabled", @"thermalStateDidChange"];
}

@end
