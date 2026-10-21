#import "RTCViewPipComponentView.h"

#import <react/renderer/components/StreamVideoReactNativeSpec/ComponentDescriptors.h>
#import <react/renderer/components/StreamVideoReactNativeSpec/EventEmitters.h>
#import <react/renderer/components/StreamVideoReactNativeSpec/Props.h>
#import <react/renderer/components/StreamVideoReactNativeSpec/RCTComponentViewHelpers.h>

#import "StreamVideoReactNativeModule.h"

// Compiled without modules, so the Swift header's @imports are skipped; import its dependencies first.
#import <WebRTC/WebRTC.h>

#if __has_include("stream_video_react_native-Swift.h")
#import "stream_video_react_native-Swift.h"
#else
#import <stream_video_react_native/stream_video_react_native-Swift.h>
#endif

using namespace facebook::react;

static NSString *_Nullable RTCViewPipNSStringOrNil(const std::string &value) {
  return value.empty() ? nil : [NSString stringWithUTF8String:value.c_str()];
}

@interface RTCViewPipComponentView () <RCTRTCViewPipViewProtocol>
@end

@implementation RTCViewPipComponentView {
  RTCViewPip *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<RTCViewPipComponentDescriptor>();
}

+ (const std::shared_ptr<const RTCViewPipProps> &)defaultProps {
  static const auto defaultProps = std::make_shared<const RTCViewPipProps>();
  return defaultProps;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    _props = [RTCViewPipComponentView defaultProps];
    _view = [self createPipView];
  }
  return self;
}

/// A fresh view holds the default prop values, matching the default props it is diffed against.
- (RTCViewPip *)createPipView {
  RTCViewPip *view = [RTCViewPip new];
  view.webRtcModuleProvider = ^WebRTCModule *_Nullable {
    return [StreamVideoReactNativeModule currentWebRTCModule];
  };
  __weak RTCViewPipComponentView *weakSelf = self;
  __weak RTCViewPip *weakView = view;
  view.onPiPChange = ^(BOOL active) {
    RTCViewPipComponentView *strongSelf = weakSelf;
    // drop events of a view replaced on recycle
    if (!strongSelf || strongSelf->_view != weakView || !strongSelf->_eventEmitter) {
      return;
    }
    std::static_pointer_cast<const RTCViewPipEventEmitter>(strongSelf->_eventEmitter)
        ->onPiPChange(RTCViewPipEventEmitter::OnPiPChange{.active = static_cast<bool>(active)});
  };
  view.onPiPBoundsChange = ^(CGFloat width, CGFloat height) {
    RTCViewPipComponentView *strongSelf = weakSelf;
    if (!strongSelf || strongSelf->_view != weakView || !strongSelf->_eventEmitter) {
      return;
    }
    std::static_pointer_cast<const RTCViewPipEventEmitter>(strongSelf->_eventEmitter)
        ->onPiPBoundsChange(RTCViewPipEventEmitter::OnPiPBoundsChange{.width = width, .height = height});
  };
  return view;
}

#pragma mark - Mounting

// The Swift view sets up PiP when it is added to a superview and tears it down when removed,
// so it is attached only while this view is mounted (a mounted Fabric view always has a superview).
- (void)didMoveToSuperview {
  [super didMoveToSuperview];
  if (self.superview) {
    if (self.contentView != _view) {
      self.contentView = _view;
    }
  } else if (self.contentView) {
    self.contentView = nil;
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  // the unmounted view already cleaned up its PiP controller; start the next use from defaults.
  _props = [RTCViewPipComponentView defaultProps];
  _view = [self createPipView];
}

#pragma mark - Props

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps {
  const auto &oldViewProps = *std::static_pointer_cast<const RTCViewPipProps>(_props);
  const auto &newViewProps = *std::static_pointer_cast<const RTCViewPipProps>(props);

  // the controller reads the other props on a track change, so apply them before streamURL.
  if (oldViewProps.participantName != newViewProps.participantName) {
    _view.participantName = RTCViewPipNSStringOrNil(newViewProps.participantName);
  }
  if (oldViewProps.participantImageURL != newViewProps.participantImageURL) {
    _view.participantImageURL = RTCViewPipNSStringOrNil(newViewProps.participantImageURL);
  }
  if (oldViewProps.isReconnecting != newViewProps.isReconnecting) {
    _view.isReconnecting = newViewProps.isReconnecting;
  }
  if (oldViewProps.isScreenSharing != newViewProps.isScreenSharing) {
    _view.isScreenSharing = newViewProps.isScreenSharing;
  }
  if (oldViewProps.hasAudio != newViewProps.hasAudio) {
    _view.hasAudio = newViewProps.hasAudio;
  }
  if (oldViewProps.isTrackPaused != newViewProps.isTrackPaused) {
    _view.isTrackPaused = newViewProps.isTrackPaused;
  }
  if (oldViewProps.isPinned != newViewProps.isPinned) {
    _view.isPinned = newViewProps.isPinned;
  }
  if (oldViewProps.isSpeaking != newViewProps.isSpeaking) {
    _view.isSpeaking = newViewProps.isSpeaking;
  }
  if (oldViewProps.connectionQuality != newViewProps.connectionQuality) {
    _view.connectionQuality = newViewProps.connectionQuality;
  }
  if (oldViewProps.mirror != newViewProps.mirror) {
    _view.mirror = newViewProps.mirror;
  }
  if (oldViewProps.streamURL != newViewProps.streamURL) {
    _view.streamURL = RTCViewPipNSStringOrNil(newViewProps.streamURL);
  }

  [super updateProps:props oldProps:oldProps];
}

#pragma mark - Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args {
  RCTRTCViewPipHandleCommand(self, commandName, args);
}

- (void)onCallClosed {
  [_view onCallClosed];
}

- (void)setPreferredContentSize:(double)width height:(double)height {
  [_view setPreferredContentSize:CGSizeMake(width, height)];
}

@end
