#import "AudioSessionManager.h"
#import "Settings.h"
#import <AVFoundation/AVAudioSession.h>

@implementation AudioSessionManager

+ (void)createAudioSessionIfNeeded {
  BOOL autoConfigureAudioSession = [Settings getAutoConfigureAudioSession];
  if (!autoConfigureAudioSession) {
#ifdef DEBUG
  NSLog(@"[Callingx][createAudioSessionIfNeeded] Auto-configuration disabled, user handles audio session");
#endif
    return;
  }

#ifdef DEBUG
  NSLog(@"[Callingx][createAudioSessionIfNeeded] Activating audio session");
#endif

  NSUInteger categoryOptions = AVAudioSessionCategoryOptionAllowBluetooth |
                               AVAudioSessionCategoryOptionAllowBluetoothA2DP;
  NSString *mode = AVAudioSessionModeDefault;

  NSDictionary *settings = [Settings getSettings];
  if (settings && settings[@"audioSession"]) {
    if (settings[@"audioSession"][@"categoryOptions"]) {
      categoryOptions = [settings[@"audioSession"][@"categoryOptions"] integerValue];
    }

    if (settings[@"audioSession"][@"mode"]) {
      mode = settings[@"audioSession"][@"mode"];
    }
  }

  AVAudioSession *audioSession = [AVAudioSession sharedInstance];
  [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord
                withOptions:categoryOptions
                      error:nil];

  [audioSession setMode:mode error:nil];

  double sampleRate = 44100.0;
  [audioSession setPreferredSampleRate:sampleRate error:nil];

  NSTimeInterval bufferDuration = .005;
  [audioSession setPreferredIOBufferDuration:bufferDuration error:nil];
  [audioSession setActive:TRUE error:nil];
}

@end
