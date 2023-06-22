#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

// Deep linking related
#import <React/RCTLinkingManager.h>
// CallKeep Related
#import "RNCallKeep.h"

// PN related
#import <Firebase.h>
#import <PushKit/PushKit.h>
#import "RNVoipPushNotificationManager.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application
continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  BOOL handledCK = [RNCallKeep application:application
                      continueUserActivity:userActivity
                        restorationHandler:restorationHandler];
  
  BOOL handledLM = [RCTLinkingManager application:application
                             continueUserActivity:userActivity
                               restorationHandler:restorationHandler];
  
  return handledCK || handledLM;
}

// --- Handle updated push credentials
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  // Register VoIP push token (a property of PKPushCredentials) with server
  // Fire 'register' event to JS
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

// --- Handle incoming pushes
- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  
  UIApplicationState state = [[UIApplication sharedApplication] applicationState];
  if (state == UIApplicationStateActive) {
    // app in foreground, no need to display incoming call through callkeep
    completion();
    return;
  }
  
  // --- Process the received push // fire 'notification' event to JS
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];
  
  NSDictionary *stream = payload.dictionaryPayload[@"stream"];
  NSLog( @"%@", stream );
  NSArray *cidArray = [stream[@"call_cid"] componentsSeparatedByString: @":"];
  NSString* callId = cidArray[1];
  NSString *createdCallerName = stream[@"created_by_display_name"];
  NSLog( @"callId:%@", callId );
  NSLog( @"createdCallerName:%@", createdCallerName );
  
  [RNCallKeep reportNewIncomingCall: callId
                             handle: createdCallerName
                         handleType: @"generic"
                           hasVideo: NO
                localizedCallerName: createdCallerName
                    supportsHolding: YES
                       supportsDTMF: YES
                   supportsGrouping: YES
                 supportsUngrouping: YES
                        fromPushKit: YES
                            payload: stream
              withCompletionHandler: completion];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  [RNCallKeep setup:@{
    @"appName": @"Stream React Native Video SDK Sample App",
    @"supportsVideo": @YES,
  }];
  
  [RNVoipPushNotificationManager voipRegistration];
  
  self.moduleName = @"StreamReactNativeVideoSDKSample";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

@end
