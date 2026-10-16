#import <objc/message.h>
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

// Asks callingx (optional dependency, resolved at runtime) whether any call is active on the device.
// Covers any registered call, not only stream calls. Without callingx, falls back to CallKit's call observer.
+ (BOOL)hasAnyActiveCall
{
    Class callingxClass = NSClassFromString(@"Callingx");
    SEL selector = @selector(hasAnyActiveCall);
    if (callingxClass && [callingxClass respondsToSelector:selector]) {
        return ((BOOL (*)(id, SEL))objc_msgSend)(callingxClass, selector);
    }

    CXCallObserver *callObserver = [[CXCallObserver alloc] init];

    for (CXCall *call in callObserver.calls) {
        if (call.hasConnected) {
            NSLog(@"[StreamVideoReactNative] Found active call with UUID: %@", call.UUID);
            return YES;
        }
    }
    return NO;
}

@end
