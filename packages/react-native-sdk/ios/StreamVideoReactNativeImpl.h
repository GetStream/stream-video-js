#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@class WebRTCModule;

NS_ASSUME_NONNULL_BEGIN

@protocol StreamVideoReactNativeEventEmitter <NSObject>
- (void)emitScreenShareEvent:(NSDictionary *)payload;
- (void)emitLowPowerModeChanged:(BOOL)enabled;
- (void)emitThermalStateChanged:(NSString *)state;
- (void)emitChargingStateChanged:(NSDictionary *)payload;
@end

@interface StreamVideoReactNativeImpl : NSObject

@property (nonatomic, weak, nullable) id<StreamVideoReactNativeEventEmitter> eventEmitter;
/// The module registry is assigned after init, so the adapter resolves these lazily.
@property (nonatomic, copy, nullable) WebRTCModule * _Nullable (^webRTCModuleProvider)(void);
@property (nonatomic, copy, nullable) RCTViewRegistry * _Nullable (^viewRegistryProvider)(void);

- (void)invalidate;

#pragma mark - Device State (sync)

- (BOOL)isLowPowerModeEnabled;
- (NSString *)currentThermalState;
- (NSDictionary *)getBatteryState;

#pragma mark - Async

- (void)captureRef:(NSNumber *)reactTag
           options:(NSDictionary *)options
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

- (void)checkPermission:(NSString *)permission
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject;

- (void)playBusyTone:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)stopBusyTone:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

- (void)startInAppScreenCapture:(BOOL)includeAudio
                        resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject;
- (void)stopInAppScreenCapture:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

- (void)startScreenShareAudioMixing:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)stopScreenShareAudioMixing:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

- (void)startTrackRecordingWithVideoTrackId:(nullable NSString *)videoTrackId
                              maxDurationMs:(NSInteger)maxDurationMs
                                targetWidth:(NSInteger)targetWidth
                               targetHeight:(NSInteger)targetHeight
                                    resolve:(RCTPromiseResolveBlock)resolve
                                     reject:(RCTPromiseRejectBlock)reject;
- (void)stopTrackRecording:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)clearStreamRecordings:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)getStreamRecordings:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
