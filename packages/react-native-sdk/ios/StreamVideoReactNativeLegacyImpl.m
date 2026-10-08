#import <UIKit/UIKit.h>
#import "StreamVideoReactNativeLegacyImpl.h"
#import "StreamVideoReactNative.h"
#import "WebRTCModule.h"
#import "WebRTCModuleOptions.h"
#import "InAppScreenCapturer.h"
#import <AVFoundation/AVFoundation.h>
#import <AudioToolbox/AudioToolbox.h>

// Import Swift-generated header for ScreenShareAudioMixer
#if __has_feature(modules)
@import stream_react_native_webrtc.Swift;
#elif __has_include("stream_react_native_webrtc-Swift.h")
#import "stream_react_native_webrtc-Swift.h"
#elif __has_include(<stream_react_native_webrtc/stream_react_native_webrtc-Swift.h>)
#import <stream_react_native_webrtc/stream_react_native_webrtc-Swift.h>
#endif

// Import Swift-generated header for TracksRecorderManager and friends.
#if __has_include("stream_video_react_native-Swift.h")
#import "stream_video_react_native-Swift.h"
#elif __has_include(<stream_video_react_native/stream_video_react_native-Swift.h>)
#import <stream_video_react_native/stream_video_react_native-Swift.h>
#endif


@interface StreamVideoReactNativeLegacyImpl () <AVAudioPlayerDelegate>
@end

@implementation StreamVideoReactNativeLegacyImpl
{
    AVAudioPlayer *_busyTonePlayer; // Instance variable
    ScreenAudioCapture *_screenAudioCapture; // Broadcast screen-share audio receiver
}

-(void)invalidate {
    if (_busyTonePlayer) {
        if (_busyTonePlayer.isPlaying) {
            [_busyTonePlayer stop];
        }
        _busyTonePlayer = nil;
        [self removeAudioInterruptionHandling];
    }
}

-(void)playBusyTone:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [self stopBusyTonePlayer]; // Stop any existing playback first
        
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

-(void)stopBusyTone:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [self stopBusyTonePlayer];
        resolve(@YES);
    });
}

- (void)stopBusyTonePlayer {
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

#pragma mark - In-App Screen Capture

-(void)startInAppScreenCapture:(BOOL)includeAudio
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject
{
    WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
    options.useInAppScreenCapture = YES;
    options.includeScreenShareAudio = includeAudio;
    resolve(nil);
}

-(void)stopInAppScreenCapture:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject
{
    WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
    options.useInAppScreenCapture = NO;
    options.includeScreenShareAudio = NO;
    resolve(nil);
}

#pragma mark - Screen Share Audio Mixing

-(void)startScreenShareAudioMixing:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject
{
    WebRTCModule *webrtcModule = self.webRTCModuleProvider ? self.webRTCModuleProvider() : nil;
    WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];

    ScreenShareAudioMixer *mixer = webrtcModule.audioDeviceModule.screenShareAudioMixer;

    // Wire mixer as capturePostProcessingDelegate on the audio processing module.
    id<RTCAudioProcessingModule> apmId = options.audioProcessingModule;
    if (apmId && [apmId isKindOfClass:[RTCDefaultAudioProcessingModule class]]) {
        RTCDefaultAudioProcessingModule *apm = (RTCDefaultAudioProcessingModule *)apmId;
        apm.capturePostProcessingDelegate = mixer;
    } else {
        NSLog(@"[SSAudio][Native] WARNING: No RTCDefaultAudioProcessingModule available, screen-share audio mixing will not work");
    }

    [mixer startMixing];

    InAppScreenCapturer *capturer = options.activeInAppScreenCapturer;
    if (capturer) {
        capturer.audioBufferHandler = ^(CMSampleBufferRef sampleBuffer) {
            [mixer enqueue:sampleBuffer];
        };
    } else {
        if (!_screenAudioCapture) {
            _screenAudioCapture = [ScreenAudioCapture new];
        }
        _screenAudioCapture.onAudioBuffer = ^(AVAudioPCMBuffer *pcmBuffer) {
            [mixer enqueuePCM:pcmBuffer];
        };
        [_screenAudioCapture start];
    }

    resolve(nil);
}

-(void)stopScreenShareAudioMixing:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject
{
    WebRTCModule *webrtcModule = self.webRTCModuleProvider ? self.webRTCModuleProvider() : nil;
    WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];

    InAppScreenCapturer *capturer = options.activeInAppScreenCapturer;
    if (capturer) {
        capturer.audioBufferHandler = nil;
    }

    if (_screenAudioCapture) {
        _screenAudioCapture.onAudioBuffer = nil;
        [_screenAudioCapture stop];
    }

    // Stop mixing
    ScreenShareAudioMixer *mixer = webrtcModule.audioDeviceModule.screenShareAudioMixer;
    [mixer stopMixing];

    // Clear capturePostProcessingDelegate
    id<RTCAudioProcessingModule> apmId = options.audioProcessingModule;
    if (apmId && [apmId isKindOfClass:[RTCDefaultAudioProcessingModule class]]) {
        RTCDefaultAudioProcessingModule *apm = (RTCDefaultAudioProcessingModule *)apmId;
        apm.capturePostProcessingDelegate = nil;
    }

    resolve(nil);
}

#pragma mark - Track Recording

-(void)startTrackRecordingWithVideoTrackId:(NSString *)videoTrackId
                             maxDurationMs:(NSInteger)maxDurationMs
                               targetWidth:(NSInteger)targetWidth
                              targetHeight:(NSInteger)targetHeight
                                   resolve:(RCTPromiseResolveBlock)resolve
                                    reject:(RCTPromiseRejectBlock)reject
{
    WebRTCModule *webrtcModule = self.webRTCModuleProvider ? self.webRTCModuleProvider() : nil;
    if (!webrtcModule) {
        reject(@"recording_error", @"WebRTCModule not available", nil);
        return;
    }

    [[TracksRecorderManager shared]
        startRecordingWithVideoTrackId:videoTrackId
                         maxDurationMs:maxDurationMs
                           targetWidth:targetWidth
                          targetHeight:targetHeight
                          webRTCModule:webrtcModule
                            completion:^(NSURL * _Nullable fileURL, NSError * _Nullable err) {
        if (err) {
            reject(@"recording_error", err.localizedDescription, err);
        } else {
            resolve(fileURL ? fileURL.absoluteString : [NSNull null]);
        }
    }];
}

-(void)stopTrackRecording:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
    [[TracksRecorderManager shared] stopRecordingWithCompletion:^{
        resolve(nil);
    }];
}

-(void)clearStreamRecordings:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject
{
    [[TracksRecorderManager shared] clearRecordingsDirectoryWithCompletion:^(NSError * _Nullable err) {
        if (err) {
            reject(@"clear_error", err.localizedDescription, err);
        } else {
            resolve(nil);
        }
    }];
}

-(void)getStreamRecordings:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
    NSArray<NSURL *> *urls = [[TracksRecorderManager shared] listRecordings];
    NSMutableArray<NSString *> *result = [NSMutableArray arrayWithCapacity:urls.count];
    for (NSURL *url in urls) {
        NSString *abs = url.absoluteString;
        if (abs) [result addObject:abs];
    }
    resolve(result);
}

@end
