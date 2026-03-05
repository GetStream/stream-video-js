#import <React/RCTBridge.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <UIKit/UIKit.h>
#import <CallKit/CallKit.h>
#import <PushKit/PushKit.h>
#import "StreamVideoReactNative.h"
#import "WebRTCModule.h"
#import "WebRTCModuleOptions.h"
#import <AVFoundation/AVFoundation.h>
#import <AudioToolbox/AudioToolbox.h>

// Do not change these consts, it is what is used react-native-webrtc
NSNotificationName const kBroadcastStartedNotification = @"iOS_BroadcastStarted";
NSNotificationName const kBroadcastStoppedNotification = @"iOS_BroadcastStopped";

static dispatch_queue_t _dictionaryQueue = nil;

void broadcastNotificationCallback(CFNotificationCenterRef center,
                                   void *observer,
                                   CFStringRef name,
                                   const void *object,
                                   CFDictionaryRef userInfo) {
    StreamVideoReactNative *this = (__bridge StreamVideoReactNative*)observer;
    NSString *eventName = (__bridge NSString*)name;
    [this screenShareEventReceived: eventName];
}

@interface StreamVideoReactNative () <AVAudioPlayerDelegate>
@end

@implementation StreamVideoReactNative
{
    bool hasListeners;
    CFNotificationCenterRef _notificationCenter;
    AVAudioPlayer *_busyTonePlayer; // Instance variable
}

// necessary for addUIBlock usage https://github.com/facebook/react-native/issues/50800#issuecomment-2823327307
@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;

RCT_EXPORT_MODULE();

+(BOOL)requiresMainQueueSetup {
    return NO;
}

+(void)setup {
    // RTCDefaultVideoEncoderFactory *videoEncoderFactory = [[RTCDefaultVideoEncoderFactory alloc] init];
    // RTCVideoEncoderFactorySimulcast *simulcastVideoEncoderFactory = [[RTCVideoEncoderFactorySimulcast alloc] initWithPrimary:videoEncoderFactory fallback:videoEncoderFactory];
    // WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
    // options.videoEncoderFactory = simulcastVideoEncoderFactory;
}

+(void)initializeSharedDictionaries {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _dictionaryQueue = dispatch_queue_create("com.stream.video.dictionary", DISPATCH_QUEUE_SERIAL);
    });
}

+(BOOL)canRegisterCall {
    Class callingxClass = NSClassFromString(@"Callingx");
    if (!callingxClass) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][canRegisterCall] Callingx not available");
        #endif
        return YES;
    }
    
    SEL selector = @selector(canRegisterCall);
    if (![callingxClass respondsToSelector:selector]) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][canRegisterCall] Callingx does not respond to canRegisterCall selector");
        #endif
        return YES;
    }
    
    NSMethodSignature *signature = [callingxClass methodSignatureForSelector:selector];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setTarget:callingxClass];
    [invocation setSelector:selector];
    [invocation invoke];
    
    BOOL canRegister = NO;
    [invocation getReturnValue:&canRegister];
    
    #if DEBUG
    NSLog(@"[StreamVideoReactNative][canRegisterCall] canRegisterCall = %@", canRegister ? @"YES" : @"NO");
    #endif
    
    return canRegister;
}

+(void)voipRegistration {
    Class voipManagerClass = NSClassFromString(@"Callingx.VoipNotificationsManager");
    if (!voipManagerClass) {
        // Fallback: Try the unmangled name (might work depending on Swift version)
        voipManagerClass = NSClassFromString(@"VoipNotificationsManager");
    }
    
    if (!voipManagerClass) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][voipRegistration] VoipNotificationsManager not available");
        #endif
        return;
    }
    
    SEL selector = @selector(voipRegistration);
    if (![voipManagerClass respondsToSelector:selector]) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][voipRegistration] VoipNotificationsManager does not respond to voipRegistration");
        #endif
        return;
    }
    
    [voipManagerClass voipRegistration];
}

+(void)didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(NSString *)type {
    Class voipManagerClass = NSClassFromString(@"Callingx.VoipNotificationsManager");
    if (!voipManagerClass) {
        // Fallback: Try the unmangled name (might work depending on Swift version)
        voipManagerClass = NSClassFromString(@"VoipNotificationsManager");
    }
    
    if (!voipManagerClass) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][didUpdatePushCredentials] VoipNotificationsManager not available");
        #endif
        return;
    }
    
    SEL selector = @selector(didUpdatePushCredentials:forType:);
    if (![voipManagerClass respondsToSelector:selector]) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][didUpdatePushCredentials] VoipNotificationsManager does not respond to didUpdatePushCredentials:forType:");
        #endif
        return;
    }
    
    [voipManagerClass didUpdatePushCredentials:credentials forType:type];
}

+(void)didReceiveIncomingPush:(PKPushPayload *)payload forType:(NSString *)type completionHandler: (void (^_Nullable)(void)) completion {
    NSDictionary *streamPayload = payload.dictionaryPayload[@"stream"];
    if (!streamPayload) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][didReceiveIncomingPush] Stream payload not found");
        #endif
        if (completion) {
            completion();
        }
        return;
    }
    
    NSString *createdCallerName = streamPayload[@"created_by_display_name"];
    NSString *callCid = streamPayload[@"call_cid"];
    if (!createdCallerName || !callCid) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][didReceiveIncomingPush] Missing required fields: created_by_display_name or call_cid");
        #endif
        if (completion) {
            completion();
        }
        return;
    }
    
    if (![StreamVideoReactNative canRegisterCall]) {
        if (completion) {
            completion();
        }
        return;
    }

    [StreamVideoReactNative reportNewIncomingCall:streamPayload forType:type completionHandler:completion];
    [StreamVideoReactNative didReceiveIncomingPushWithPayload:payload forType:type];
}

+(void)reportNewIncomingCall:(NSDictionary *)streamPayload forType:(NSString *)type completionHandler: (void (^_Nullable)(void)) completion {
    Class callingxClass = NSClassFromString(@"Callingx");
    if (!callingxClass) {
        NSLog(@"[StreamVideoReactNative][didReceiveIncomingPush] Callingx not available");
        return;
    }
    
    SEL selector = @selector(reportNewIncomingCall:handle:handleType:hasVideo:localizedCallerName:supportsHolding:supportsDTMF:supportsGrouping:supportsUngrouping:payload:withCompletionHandler:);
    if (![callingxClass respondsToSelector:selector]) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][didReceiveIncomingPush] Callingx does not respond to selector");
        #endif
        return;
    }
    
    NSString *callCid = streamPayload[@"call_cid"];
    NSString *createdCallerName = streamPayload[@"created_by_display_name"];
    NSString *videoIncluded = streamPayload[@"video"];
    BOOL hasVideo = [videoIncluded isEqualToString:@"false"] ? NO : YES;
    NSString *handleType = @"generic";
    BOOL supportsHolding = NO;
    BOOL supportsDTMF = NO;
    BOOL supportsGrouping = NO;
    BOOL supportsUngrouping = NO;
    void (^completionHandler)(void) = completion;

    NSMethodSignature *signature = [callingxClass methodSignatureForSelector:selector];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setTarget:callingxClass];
    [invocation setSelector:selector];
    [invocation setArgument:&callCid atIndex:2];
    [invocation setArgument:&createdCallerName atIndex:3];
    [invocation setArgument:&handleType atIndex:4];
    [invocation setArgument:&hasVideo atIndex:5];
    [invocation setArgument:&createdCallerName atIndex:6];
    [invocation setArgument:&supportsHolding atIndex:7];
    [invocation setArgument:&supportsDTMF atIndex:8];
    [invocation setArgument:&supportsGrouping atIndex:9];
    [invocation setArgument:&supportsUngrouping atIndex:10];
    [invocation setArgument:&streamPayload atIndex:11];
    [invocation setArgument:&completionHandler atIndex:12];
    [invocation invoke];
}

+(void)didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(NSString *)type {
    Class voipManagerClass = NSClassFromString(@"Callingx.VoipNotificationsManager");
    if (!voipManagerClass) {
        // Fallback: Try the unmangled name (might work depending on Swift version)
        voipManagerClass = NSClassFromString(@"VoipNotificationsManager");
    }
    
    if (!voipManagerClass) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][didReceiveIncomingPushWithPayload] VoipNotificationsManager not available");
        #endif
        return;
    }
    
    SEL selector = @selector(didReceiveIncomingPushWithPayload:forType:);
    if (![voipManagerClass respondsToSelector:selector]) {
        #if DEBUG
        NSLog(@"[StreamVideoReactNative][didReceiveIncomingPushWithPayload] VoipNotificationsManager does not respond to didReceiveIncomingPushWithPayload:forType:");
        #endif
        return;
    }
    
    [voipManagerClass didReceiveIncomingPushWithPayload:payload forType:type];
}

-(instancetype)init {
    if ((self = [super init])) {
        _notificationCenter = CFNotificationCenterGetDarwinNotifyCenter();
        [UIDevice currentDevice].batteryMonitoringEnabled = YES;
        [self setupScreenshareEventObserver];
        [StreamVideoReactNative initializeSharedDictionaries];
    }
    return self;
}

RCT_EXPORT_METHOD(isLowPowerModeEnabled:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@([NSProcessInfo processInfo].lowPowerModeEnabled));
}

RCT_EXPORT_METHOD(currentThermalState:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    NSInteger thermalState = [NSProcessInfo processInfo].thermalState;
    NSString *thermalStateString = [self stringForThermalState:thermalState];
    resolve(thermalStateString);
}

-(void)invalidate {
    if (_busyTonePlayer) {
        if (_busyTonePlayer.isPlaying) {
            [_busyTonePlayer stop];
        }
        _busyTonePlayer = nil;
        [self removeAudioInterruptionHandling];
    }
    [self clearScreenshareEventObserver];
    [super invalidate];
}


-(void)setupScreenshareEventObserver {
    CFNotificationCenterAddObserver(_notificationCenter,
                                    (__bridge const void *)(self),
                                    broadcastNotificationCallback,
                                    (__bridge CFStringRef)kBroadcastStartedNotification,
                                    NULL,
                                    CFNotificationSuspensionBehaviorDeliverImmediately);
    CFNotificationCenterAddObserver(_notificationCenter,
                                    (__bridge const void *)(self),
                                    broadcastNotificationCallback,
                                    (__bridge CFStringRef)kBroadcastStoppedNotification,
                                    NULL,
                                    CFNotificationSuspensionBehaviorDeliverImmediately);
}

-(void)clearScreenshareEventObserver {
    CFNotificationCenterRemoveObserver(_notificationCenter,
                                       (__bridge const void *)(self),
                                       (__bridge CFStringRef)kBroadcastStartedNotification,
                                       NULL);
    CFNotificationCenterRemoveObserver(_notificationCenter,
                                       (__bridge const void *)(self),
                                       (__bridge CFStringRef)kBroadcastStoppedNotification,
                                       NULL);
}

-(void)startObserving {
    hasListeners = YES;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(powerModeDidChange)
                                                 name:NSProcessInfoPowerStateDidChangeNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(thermalStateDidChange)
                                                 name:NSProcessInfoThermalStateDidChangeNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(batteryStateDidChange:)
                                                 name:UIDeviceBatteryStateDidChangeNotification
                                               object:nil];
}

-(void)stopObserving {
    hasListeners = NO;
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:NSProcessInfoPowerStateDidChangeNotification
                                                  object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:NSProcessInfoThermalStateDidChangeNotification
                                                  object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:UIDeviceBatteryStateDidChangeNotification
                                                  object:nil];
}

- (void)powerModeDidChange {
    if (!hasListeners) {
        return;
    }
    BOOL lowPowerEnabled = [NSProcessInfo processInfo].lowPowerModeEnabled;
    [self sendEventWithName:@"isLowPowerModeEnabled" body:@(lowPowerEnabled)];
}

- (void)thermalStateDidChange {
    if (!hasListeners) {
        return;
    }
    NSInteger thermalState = [NSProcessInfo processInfo].thermalState;
    NSString *thermalStateString = [self stringForThermalState:thermalState];
    [self sendEventWithName:@"thermalStateDidChange" body:thermalStateString];
}

- (NSString *)stringForThermalState:(NSInteger)thermalState {
    switch (thermalState) {
        case NSProcessInfoThermalStateNominal:
            return @"NOMINAL";
        case NSProcessInfoThermalStateFair:
            return @"FAIR";
        case NSProcessInfoThermalStateSerious:
            return @"SERIOUS";
        case NSProcessInfoThermalStateCritical:
            return @"CRITICAL";
        default:
            return @"UNSPECIFIED";
    }
}

-(void)screenShareEventReceived:(NSString*)event {
    if (hasListeners) {
        [self sendEventWithName:@"StreamVideoReactNative_Ios_Screenshare_Event" body:@{@"name": event}];
    }
}

RCT_EXPORT_METHOD(captureRef:(nonnull NSNumber *)reactTag
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // It seems that due to how UIBlocks work with uiManager, we need to call the methods in UIManagerQueue
    // for the blocks to be dispatched before the batch is completed
    dispatch_async(RCTGetUIManagerQueue(), ^{
        [self.viewRegistry_DEPRECATED addUIBlock:^(RCTViewRegistry *viewRegistry) {
            UIView *view = [viewRegistry viewForReactTag:reactTag];
            
            if (!view) {
                reject(RCTErrorUnspecified, [NSString stringWithFormat:@"No view found with reactTag: %@", reactTag], nil);
                return;
            }
            
            // Get capture options
            NSString *format = options[@"format"] ? [options[@"format"] lowercaseString] : @"png";
            CGFloat quality = options[@"quality"] ? [options[@"quality"] floatValue] : 1.0;
            NSNumber *width = options[@"width"];
            NSNumber *height = options[@"height"];
            
            // Determine the size to render
            CGSize size;
            CGRect bounds = view.bounds;
            if (width && height) {
                size = CGSizeMake([width floatValue], [height floatValue]);
            } else {
                size = bounds.size;
            }
            
            // Abort if size is invalid
            if (size.width <= 0 || size.height <= 0) {
                reject(@"INVALID_SIZE", @"View has invalid size", nil);
                return;
            }
            
            // Begin image context with appropriate scale
            UIGraphicsBeginImageContextWithOptions(size, NO, 0);
            
            // Calculate scaling if needed
            CGRect drawRect = bounds;
            if (width && height) {
                CGFloat scaleX = size.width / bounds.size.width;
                CGFloat scaleY = size.height / bounds.size.height;
                
                // Apply transform to context for scaling if dimensions differ
                CGContextRef context = UIGraphicsGetCurrentContext();
                if (context) {
                    CGContextTranslateCTM(context, 0, size.height);
                    CGContextScaleCTM(context, scaleX, -scaleY);
                    drawRect = CGRectMake(0, 0, bounds.size.width, bounds.size.height);
                }
            }
            
            BOOL success = [view drawViewHierarchyInRect:drawRect afterScreenUpdates:YES];
            
            UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
            UIGraphicsEndImageContext();
            
            if (!success || !image) {
                reject(@"CAPTURE_FAILED", @"Failed to capture view as image", nil);
                return;
            }
            
            // Convert to base64 string based on format
            NSString *base64;
            if ([format isEqualToString:@"jpg"] || [format isEqualToString:@"jpeg"]) {
                NSData *imageData = UIImageJPEGRepresentation(image, quality);
                base64 = [imageData base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithCarriageReturn];
            } else {
                // Default to PNG
                NSData *imageData = UIImagePNGRepresentation(image);
                base64 = [imageData base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithCarriageReturn];
            }
            
            if (base64) {
                resolve(base64);
            } else {
                reject(@"ENCODING_FAILED", @"Failed to encode image to base64", nil);
            }
        }];
    });
}

RCT_EXPORT_METHOD(getBatteryState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    UIDeviceBatteryState batteryState = [UIDevice currentDevice].batteryState;
    BOOL isCharging = (batteryState == UIDeviceBatteryStateCharging ||
                       batteryState == UIDeviceBatteryStateFull);
    
    resolve(@{
        @"charging": @(isCharging),
        @"level": @(round([UIDevice currentDevice].batteryLevel * 100))
    });
}

RCT_EXPORT_METHOD(checkPermission:(NSString *)permission
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *normalizedPermission = [permission lowercaseString];
    AVMediaType mediaType = nil;

    if ([normalizedPermission isEqualToString:@"camera"]) {
        mediaType = AVMediaTypeVideo;
    } else if ([normalizedPermission isEqualToString:@"microphone"]) {
        mediaType = AVMediaTypeAudio;
    } else {
        NSString *errorMessage = [NSString stringWithFormat:@"Unsupported media device kind: %@", permission];
        reject(@"UNSUPPORTED_MEDIA_DEVICE_KIND", errorMessage, nil);
        return;
    }

    AVAuthorizationStatus status = [AVCaptureDevice authorizationStatusForMediaType:mediaType];
    resolve(@(status == AVAuthorizationStatusAuthorized));
}

-(void)batteryStateDidChange:(NSNotification *)notification {
    UIDeviceBatteryState batteryState = [UIDevice currentDevice].batteryState;
    BOOL isCharging = (batteryState == UIDeviceBatteryStateCharging ||
                       batteryState == UIDeviceBatteryStateFull);
    
    [self sendEventWithName:@"chargingStateChanged" body:@{
        @"charging": @(isCharging),
        @"level": @(round([UIDevice currentDevice].batteryLevel * 100))
    }];
}

-(NSArray<NSString *> *)supportedEvents {
    return @[
        @"StreamVideoReactNative_Ios_Screenshare_Event",
        @"isLowPowerModeEnabled",
        @"thermalStateDidChange",
        @"chargingStateChanged"
    ];
}

//current implementation will return any registered calls not only stream calls
+ (BOOL)hasAnyActiveCall
{
    CXCallObserver *callObserver = [[CXCallObserver alloc] init];
    
    for(CXCall *call in callObserver.calls){
        if(call.hasConnected){
            NSLog(@"[RNCallKeep] Found active call with UUID: %@", call.UUID);
            return YES;
        }
    }
    return NO;
}


RCT_EXPORT_METHOD(playBusyTone:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [self stopBusyTone]; // Stop any existing playback first
        
        // Configure audio session
        NSError *sessionError = nil;
        AVAudioSession *session = [AVAudioSession sharedInstance];
        [session setCategory:AVAudioSessionCategoryPlayback
                        mode:AVAudioSessionModeDefault
                     options:AVAudioSessionCategoryOptionMixWithOthers
                       error:&sessionError];
        
        if (sessionError) {
            NSString *errorMsg = [NSString stringWithFormat:@"Failed to set audio session category: %@", sessionError.localizedDescription];
            NSLog(@"%@", errorMsg);
            reject(@"AUDIO_SESSION_ERROR", errorMsg, sessionError);
            return;
        }
        
        [session setActive:YES error:&sessionError];
        if (sessionError) {
            NSString *errorMsg = [NSString stringWithFormat:@"Failed to activate audio session: %@", sessionError.localizedDescription];
            NSLog(@"%@", errorMsg);
            reject(@"AUDIO_SESSION_ERROR", errorMsg, sessionError);
            return;
        }
        
        // Generate busy tone data
        NSData *busyToneData = [self generateBusyToneData];
        if (!busyToneData || busyToneData.length == 0) {
            NSString *errorMsg = @"Failed to generate busy tone data";
            NSLog(@"%@", errorMsg);
            reject(@"AUDIO_GENERATION_ERROR", errorMsg, nil);
            return;
        }
        
        // Create audio player
        NSError *playerError = nil;
        self->_busyTonePlayer = [[AVAudioPlayer alloc] initWithData:busyToneData error:&playerError];
        
        if (playerError || !self->_busyTonePlayer) {
            NSString *errorMsg = [NSString stringWithFormat:@"Failed to create audio player: %@", playerError.localizedDescription];
            NSLog(@"%@", errorMsg);
            reject(@"AUDIO_PLAYER_ERROR", errorMsg, playerError);
            return;
        }
        
        // Configure player
        self->_busyTonePlayer.delegate = self;
        self->_busyTonePlayer.numberOfLoops = -1; // Loop indefinitely
        self->_busyTonePlayer.volume = 0.5; // Set reasonable volume
        
        // Setup audio interruption handling
        [self setupAudioInterruptionHandling];
        
        // Prepare and play
        BOOL prepared = [self->_busyTonePlayer prepareToPlay];
        if (!prepared) {
            NSString *errorMsg = @"Failed to prepare audio player";
            NSLog(@"%@", errorMsg);
            reject(@"AUDIO_PLAYER_ERROR", errorMsg, nil);
            return;
        }
        
        BOOL playing = [self->_busyTonePlayer play];
        if (playing) {
            resolve(@YES);
        } else {
            NSString *errorMsg = @"Failed to start audio playback";
            NSLog(@"%@", errorMsg);
            reject(@"AUDIO_PLAYBACK_ERROR", errorMsg, nil);
        }
    });
}

- (NSData *)generateBusyToneData {
    // Generate 1 second of busy tone pattern: 0.5s 480Hz tone, 0.5s silence
    const int sampleRate = 44100; // Standard sample rate for better quality
    const float duration = 1.0; // 1 second total
    const float beepDuration = 0.5; // 0.5 seconds beep
    const float frequency = 480.0; // 480 Hz busy tone frequency
    
    int totalSamples = (int)(duration * sampleRate);
    
    // Create PCM data buffer with proper size calculation
    NSMutableData *audioData = [NSMutableData dataWithLength:44 + totalSamples * 2]; // WAV header + 16-bit samples
    uint8_t *bytes = (uint8_t *)[audioData mutableBytes];
    
    // Helper function to write little-endian values
    void (^writeLittleEndian32)(uint8_t *, uint32_t) = ^(uint8_t *dest, uint32_t value) {
        dest[0] = value & 0xFF;
        dest[1] = (value >> 8) & 0xFF;
        dest[2] = (value >> 16) & 0xFF;
        dest[3] = (value >> 24) & 0xFF;
    };
    
    void (^writeLittleEndian16)(uint8_t *, uint16_t) = ^(uint8_t *dest, uint16_t value) {
        dest[0] = value & 0xFF;
        dest[1] = (value >> 8) & 0xFF;
    };
    
    // Write WAV header with proper endianness
    memcpy(bytes, "RIFF", 4);
    writeLittleEndian32(bytes + 4, 36 + totalSamples * 2);
    memcpy(bytes + 8, "WAVE", 4);
    memcpy(bytes + 12, "fmt ", 4);
    writeLittleEndian32(bytes + 16, 16); // PCM format chunk size
    writeLittleEndian16(bytes + 20, 1);  // PCM format
    writeLittleEndian16(bytes + 22, 1);  // Mono
    writeLittleEndian32(bytes + 24, sampleRate);
    writeLittleEndian32(bytes + 28, sampleRate * 2); // Bytes per second
    writeLittleEndian16(bytes + 32, 2);  // Bytes per sample
    writeLittleEndian16(bytes + 34, 16); // Bits per sample
    memcpy(bytes + 36, "data", 4);
    writeLittleEndian32(bytes + 40, totalSamples * 2);
    
    // Generate audio samples
    int16_t *samples = (int16_t *)(bytes + 44);
    for (int i = 0; i < totalSamples; i++) {
        float t = (float)i / sampleRate;
        float cycleTime = fmod(t, duration); // Time within current cycle
        
        if (cycleTime < beepDuration) {
            // Generate 480Hz sine wave with proper amplitude
            float sineWave = sinf(2.0f * M_PI * frequency * t);
            float amplitude = 0.4f * sineWave; // Increased amplitude for better audibility
            samples[i] = CFSwapInt16HostToLittle((int16_t)(amplitude * 32767.0f));
        } else {
            // Silence period
            samples[i] = 0;
        }
    }
    
    return audioData;
}

RCT_EXPORT_METHOD(stopBusyTone:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [self stopBusyTone];
        resolve(@YES);
    });
}

- (void)stopBusyTone {
    if (_busyTonePlayer) {
        if (_busyTonePlayer.isPlaying) {
            [_busyTonePlayer stop];
        }
        
        _busyTonePlayer = nil;
        
        // Remove audio interruption observers
        [self removeAudioInterruptionHandling];
        
        // Only deactivate audio session if there are no active calls
        // This prevents interfering with ongoing WebRTC audio sessions
        BOOL hasActiveCall = [StreamVideoReactNative hasAnyActiveCall];
        if (!hasActiveCall) {
            NSError *error = nil;
            [[AVAudioSession sharedInstance] setActive:NO
                                           withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                                                 error:&error];
                if (error) {
                    NSLog(@"Error deactivating audio session: %@", error.localizedDescription);
                }
            }
        }
}

#pragma mark - AVAudioPlayerDelegate

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag {
    // Audio finished - this shouldn't happen with infinite loops
    // Check if this is our player and handle cleanup if needed
    if (player == _busyTonePlayer) {
        _busyTonePlayer = nil;
    }
}

- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player error:(NSError *)error {
    if (player == _busyTonePlayer) {
        _busyTonePlayer = nil;
    }
}

// Note: audioPlayerBeginInterruption and audioPlayerEndInterruption are deprecated
// Audio interruptions are now handled via AVAudioSession notifications
// These are registered in setupAudioInterruptionHandling method

#pragma mark - Audio Interruption Handling

- (void)setupAudioInterruptionHandling {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(audioSessionInterrupted:)
                                                 name:AVAudioSessionInterruptionNotification
                                               object:[AVAudioSession sharedInstance]];
}

- (void)removeAudioInterruptionHandling {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:AVAudioSessionInterruptionNotification
                                                  object:[AVAudioSession sharedInstance]];
}

- (void)audioSessionInterrupted:(NSNotification *)notification {
    AVAudioSessionInterruptionType interruptionType = [notification.userInfo[AVAudioSessionInterruptionTypeKey] unsignedIntegerValue];
    
    switch (interruptionType) {
        case AVAudioSessionInterruptionTypeBegan:
            if (_busyTonePlayer && _busyTonePlayer.isPlaying) {
                [_busyTonePlayer pause];
            }
            break;
            
        case AVAudioSessionInterruptionTypeEnded: {
            AVAudioSessionInterruptionOptions options = [notification.userInfo[AVAudioSessionInterruptionOptionKey] unsignedIntegerValue];
            
            if (options & AVAudioSessionInterruptionOptionShouldResume) {
                // Reactivate audio session
                NSError *error = nil;
                [[AVAudioSession sharedInstance] setActive:YES error:&error];
                
                if (!error && _busyTonePlayer) {
                    [_busyTonePlayer play];
                } else if (error) {
                    NSLog(@"Failed to reactivate audio session after interruption: %@", error.localizedDescription);
                }
            }
            break;
        }
    }
}

@end
