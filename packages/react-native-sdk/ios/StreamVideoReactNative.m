#import <CallKit/CallKit.h>
#import "StreamVideoReactNative.h"

@implementation StreamVideoReactNative

+(void)setup {
    // RTCDefaultVideoEncoderFactory *videoEncoderFactory = [[RTCDefaultVideoEncoderFactory alloc] init];
    // RTCVideoEncoderFactorySimulcast *simulcastVideoEncoderFactory = [[RTCVideoEncoderFactorySimulcast alloc] initWithPrimary:videoEncoderFactory fallback:videoEncoderFactory];
    // WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
    // options.videoEncoderFactory = simulcastVideoEncoderFactory;
}

+(void)voipRegistration {
    Class voipManagerClass = NSClassFromString(@"Callingx.VoipNotificationsManager");
    if (!voipManagerClass) {
        // Fallback: Try the unmangled name (might work depending on Swift version)
        voipManagerClass = NSClassFromString(@"VoipNotificationsManager");
    }

    if (!voipManagerClass) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][voipRegistration] VoipNotificationsManager not available");
        #endif
        return;
    }

    SEL selector = @selector(voipRegistration);
    if (![voipManagerClass respondsToSelector:selector]) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][voipRegistration] VoipNotificationsManager does not respond to voipRegistration");
        #endif
        return;
    }

    [voipManagerClass voipRegistration];
}

//current implementation will return any registered calls not only stream calls
+ (BOOL)hasAnyActiveCall
{
    CXCallObserver *callObserver = [[CXCallObserver alloc] init];

    for(CXCall *call in callObserver.calls){
        if(call.hasConnected){
            NSLog(@"[RNCallKeep] Found active call with UUID: %@", call.UUID);
            return YES;
        }
    }
    return NO;
}

@end
