#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "StreamVideoReactNative.h"
#import "WebRTCModule.h"
#import "WebRTCModuleOptions.h"

// Do not change these consts, it is what is used react-native-webrtc
NSNotificationName const kBroadcastStartedNotification = @"iOS_BroadcastStarted";
NSNotificationName const kBroadcastStoppedNotification = @"iOS_BroadcastStopped";

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
    
    return self;
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
}

-(void)stopObserving {
    hasListeners = NO;
}

-(void)screenShareEventReceived:(NSString*)event {
    if (hasListeners) {
        [self sendEventWithName:@"StreamVideoReactNative_Ios_Screenshare_Event" body:@{@"name": event}];
    }
}

-(NSArray<NSString *> *)supportedEvents {
    return @[@"StreamVideoReactNative_Ios_Screenshare_Event"];
}


@end
