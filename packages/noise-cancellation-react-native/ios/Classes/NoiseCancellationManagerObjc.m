#import "NoiseCancellationManagerObjc.h"
// use_frameworks! (dynamic framework)
#if __has_include(<stream_io_noise_cancellation_react_native/stream_io_noise_cancellation_react_native-Swift.h>)
#import <stream_io_noise_cancellation_react_native/stream_io_noise_cancellation_react_native-Swift.h>
// no use_frameworks! (static library)
#else
#import "stream_io_noise_cancellation_react_native-Swift.h"
#endif

@interface NoiseCancellationManagerObjc ()
@end

@implementation NoiseCancellationManagerObjc

+ (instancetype)sharedInstance {
    static NoiseCancellationManagerObjc *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[NoiseCancellationManagerObjc alloc] init];
    });
    return sharedInstance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        // Initialization if needed
    }
    return self;
}

- (void)registerProcessor {
    // Call the Swift implementation
    NoiseCancellationManager *swiftManager = [NoiseCancellationManager getInstance];
    [swiftManager registerProcessor];
}

@end
