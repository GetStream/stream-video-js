#import <objc/message.h>
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
// Returns NO when callingx is not installed. Covers any registered call, not only stream calls.
+ (BOOL)hasAnyActiveCall
{
    Class callingxClass = NSClassFromString(@"Callingx");
    SEL selector = @selector(hasAnyActiveCall);
    if (!callingxClass || ![callingxClass respondsToSelector:selector]) {
        return NO;
    }
    return ((BOOL (*)(id, SEL))objc_msgSend)(callingxClass, selector);
}

+ (BOOL)handleUserActivity:(NSUserActivity *)userActivity
{
    Class callingxClass = NSClassFromString(@"Callingx");
    SEL selector = @selector(handleUserActivity:);
    if (!callingxClass || ![callingxClass respondsToSelector:selector]) {
        return NO;
    }
    return ((BOOL (*)(id, SEL, NSUserActivity *))objc_msgSend)(callingxClass, selector, userActivity);
}

@end
