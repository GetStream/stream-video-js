#import "NoiseCancellationManagerObjc.h"
#import "stream_io_noise_cancellation_react_native-Swift.h"

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
