//
//  RTCViewPip.m
//  stream-video-react-native
//
//  Created by santhosh vaiyapuri on 22/08/2024.
//

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RTCViewPipManager, RCTViewManager)
RCT_CUSTOM_VIEW_PROPERTY(streamURL, NSString *, RTCViewPip) {
    if (!json) {
        view.videoTrack = nil;
        return;
    }

    NSString *streamReactTag = (NSString *)json;
    WebRTCModule *module = view.module;

    dispatch_async(module.workerQueue, ^{
        RTCMediaStream *stream = [module streamForReactTag:streamReactTag];
        NSArray *videoTracks = stream ? stream.videoTracks : @[];
        RTCVideoTrack *videoTrack = [videoTracks firstObject];
        if (!videoTrack) {
            RCTLogWarn(@"No video stream for react tag: %@", streamReactTag);
        } else {
            dispatch_async(dispatch_get_main_queue(), ^{
                view.videoTrack = videoTrack;
            });
        }
    });
}
 
@end
