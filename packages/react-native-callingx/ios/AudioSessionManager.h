#import <Foundation/Foundation.h>
#import <AVFoundation/AVAudioSession.h>

NS_ASSUME_NONNULL_BEGIN

@interface AudioSessionManager : NSObject

+ (void)createAudioSessionIfNeeded;

@end

NS_ASSUME_NONNULL_END
