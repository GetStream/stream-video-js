#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NoiseCancellationManagerObjc : NSObject

+ (instancetype)sharedInstance;
- (void)registerProcessor;

@end

NS_ASSUME_NONNULL_END