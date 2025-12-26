#import <Foundation/Foundation.h>
#import <CallKit/CallKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface Settings : NSObject

+ (NSDictionary *)getSettings;
+ (void)setSettings:(NSDictionary *)options;
+ (BOOL)getAutoConfigureAudioSession;
+ (BOOL)getShouldRejectCallWhenBusy;
+ (void)setShouldRejectCallWhenBusy:(BOOL)shouldReject;
+ (CXProviderConfiguration *)getProviderConfiguration:(NSDictionary *)settings;
+ (NSSet *)getSupportedHandleTypes:(id)handleType;
+ (CXHandleType)getHandleType:(NSString *)handleType;

@end

NS_ASSUME_NONNULL_END
