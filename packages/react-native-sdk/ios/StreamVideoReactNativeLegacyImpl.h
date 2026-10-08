#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@class WebRTCModule;

NS_ASSUME_NONNULL_BEGIN

@interface StreamVideoReactNativeLegacyImpl : NSObject

/// The module registry is assigned after init, so the adapter resolves it lazily.
@property (nonatomic, copy, nullable) WebRTCModule * _Nullable (^webRTCModuleProvider)(void);

- (void)invalidate;

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
