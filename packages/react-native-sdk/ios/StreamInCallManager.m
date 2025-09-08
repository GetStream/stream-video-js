#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(StreamInCallManager, RCTEventEmitter)

RCT_EXTERN_METHOD(setAudioRole:(NSString *)audioRole)

RCT_EXTERN_METHOD(setDefaultAudioDeviceEndpointType:(NSString *)endpointType)

RCT_EXTERN_METHOD(start)

RCT_EXTERN_METHOD(stop)

RCT_EXTERN_METHOD(showAudioRoutePicker)

RCT_EXTERN_METHOD(setForceSpeakerphoneOn:(BOOL)enable)

RCT_EXTERN_METHOD(setMicrophoneMute:(BOOL)enable)

RCT_EXTERN_METHOD(logAudioState)

+(BOOL)requiresMainQueueSetup {
  return NO;
}

@end 