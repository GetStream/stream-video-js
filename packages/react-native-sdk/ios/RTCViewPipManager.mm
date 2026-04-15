//
//  RTCViewPipManager.m
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//
// tutorial used: https://teabreak.e-spres-oh.com/swift-in-react-native-the-ultimate-guide-part-2-ui-components-907767123d9e

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RTCViewPipManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(streamURL, NSString)
RCT_EXPORT_VIEW_PROPERTY(mirror, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onPiPChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(participantName, NSString)
RCT_EXPORT_VIEW_PROPERTY(participantImageURL, NSString)
RCT_EXPORT_VIEW_PROPERTY(isReconnecting, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isScreenSharing, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hasAudio, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isTrackPaused, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isPinned, BOOL)
RCT_EXPORT_VIEW_PROPERTY(isSpeaking, BOOL)
RCT_EXPORT_VIEW_PROPERTY(connectionQuality, NSInteger)
RCT_EXTERN_METHOD(onCallClosed:(nonnull NSNumber*) reactTag)
RCT_EXTERN_METHOD(setPreferredContentSize:(nonnull NSNumber *)reactTag width:(CGFloat)w height:(CGFloat)h);

@end
