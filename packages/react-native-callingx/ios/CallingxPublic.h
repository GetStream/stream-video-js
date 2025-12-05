//
//  CallingModule.h
//  POCCallingX
//
//  Created by Artem Grintsevich on 17/11/2025.
//

#import <Foundation/Foundation.h>
#import <CallKit/CallKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface Callingx : NSObject

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options NS_AVAILABLE_IOS(9_0);

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:(void(^)(NSArray * __nullable restorableObjects))restorationHandler;

+ (void)reportNewIncomingCall:(NSString *)uuidString
                       handle:(NSString *)handle
                   handleType:(NSString *)handleType
                     hasVideo:(BOOL)hasVideo
          localizedCallerName:(NSString * _Nullable)localizedCallerName
              supportsHolding:(BOOL)supportsHolding
                 supportsDTMF:(BOOL)supportsDTMF
             supportsGrouping:(BOOL)supportsGrouping
           supportsUngrouping:(BOOL)supportsUngrouping
                  fromPushKit:(BOOL)fromPushKit
                      payload:(NSDictionary * _Nullable)payload
        withCompletionHandler:(void (^_Nullable)(void))completion;

+ (void)endCallWithUUID:(NSString *)uuidString
                 reason:(int)reason;

+ (BOOL)isCallActive:(NSString *)uuidString;

+ (void)setup:(NSDictionary *)options;

@end

NS_ASSUME_NONNULL_END
