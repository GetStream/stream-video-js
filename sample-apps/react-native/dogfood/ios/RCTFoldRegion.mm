//
//  RCTFoldRegion.mm
//  StreamReactNativeVideoSDKSample
//
//  FoldRegion TurboModule: reports the foldable hinge to JS (iOS 27.1+).
//  The observation logic lives in FoldRegionObserver.swift.
//
#import <FoldRegionSpec/FoldRegionSpec.h>
// the app's Swift header also declares AppDelegate/ReactNativeDelegate, whose
// superclasses and protocols must be visible before importing it
#import <UserNotifications/UserNotifications.h>
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "StreamReactNativeVideoSDKSample-Swift.h"

@interface RCTFoldRegion : NativeFoldRegionSpecBase <NativeFoldRegionSpec>
@end

@implementation RCTFoldRegion {
  FoldRegionObserver *_observer;
}

RCT_EXPORT_MODULE(FoldRegion)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    __weak RCTFoldRegion *weakSelf = self;
    _observer = [[FoldRegionObserver alloc] initOnChange:^(NSDictionary *division) {
      [weakSelf emitOnFoldDivisionChanged:division];
    }];
  }
  return self;
}

- (void)invalidate
{
  FoldRegionObserver *observer = _observer;
  dispatch_async(dispatch_get_main_queue(), ^{
    [observer stop];
  });
}

// Observation starts on the first call from JS: by then the event emitter
// callback is set, so the initial hinge update can be emitted safely.
- (void)getDivision:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  FoldRegionObserver *observer = _observer;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!observer.isStarted) {
      [observer start];
    }
    resolve([observer currentDivision]);
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeFoldRegionSpecJSI>(params);
}

@end
