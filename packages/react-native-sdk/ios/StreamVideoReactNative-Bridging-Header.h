#import <React/RCTBridge.h>
#import <React/RCTViewManager.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTView.h>
#import <React/UIView+React.h>

#import <WebRTC/RTCCVPixelBuffer.h>
#import <WebRTC/RTCVideoFrame.h>
#import <WebRTC/RTCVideoTrack.h>
#import <WebRTC/RTCVideoRenderer.h>
#import <WebRTC/RTCVideoFrameBuffer.h>
#import "WebRTCModule.h"
#import "WebRTCModuleOptions.h"

// Import Swift-generated header for ScreenShareAudioMixer
#if __has_feature(modules)
@import stream_react_native_webrtc.Swift;
#elif __has_include("stream_react_native_webrtc-Swift.h")
#import "stream_react_native_webrtc-Swift.h"
#elif __has_include(<stream_react_native_webrtc/stream_react_native_webrtc-Swift.h>)
#import <stream_react_native_webrtc/stream_react_native_webrtc-Swift.h>
#endif
