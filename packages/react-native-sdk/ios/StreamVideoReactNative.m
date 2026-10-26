#import <CallKit/CallKit.h>
#import "StreamVideoReactNative.h"

@implementation StreamVideoReactNative

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

+ (BOOL)handleUserActivity:(NSUserActivity *)userActivity {
    Class callingxClass = NSClassFromString(@"Callingx");
    SEL selector = @selector(handleUserActivity:);
    if (!callingxClass || ![callingxClass respondsToSelector:selector]) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][handleUserActivity] Callingx not available");
        #endif
        return NO;
    }

    BOOL (*handleUserActivity)(id, SEL, NSUserActivity *) = (BOOL (*)(id, SEL, NSUserActivity *))[callingxClass methodForSelector:selector];
    BOOL handled = handleUserActivity(callingxClass, selector, userActivity);
    #if DEBUG
    NSLog(@"[StreamVideoReactNative][handleUserActivity] type: %@, handled: %d", userActivity.activityType, handled);
    #endif
    return handled;
}

//current implementation will return any registered calls not only stream calls
+ (BOOL)hasAnyActiveCall
{
    CXCallObserver *callObserver = [[CXCallObserver alloc] init];

    for(CXCall *call in callObserver.calls){
        if(call.hasConnected){
            NSLog(@"[StreamVideoReactNative] Found active call with UUID: %@", call.UUID);
            return YES;
        }
    }
    return NO;
}

@end
