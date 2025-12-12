#import "Settings.h"
#import <UIKit/UIKit.h>

@implementation Settings

+ (NSDictionary *)getSettings {
  return [[NSUserDefaults standardUserDefaults] dictionaryForKey:@"CallingxSettings"];
}

+ (void)setSettings:(NSDictionary *)options {
#ifdef DEBUG
  NSLog(@"[Settings][setSettings] options = %@", options);
#endif
  NSDictionary *settings = [[NSMutableDictionary alloc] initWithDictionary:options];
  // Store settings in NSUserDefault
  [[NSUserDefaults standardUserDefaults] setObject:settings forKey:@"CallingxSettings"];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

+ (BOOL)getAutoConfigureAudioSession {
  NSDictionary *settings = [Settings getSettings];
  if (settings && settings[@"autoConfigureAudioSession"]) {
    return [settings[@"autoConfigureAudioSession"] boolValue];
  }
  return NO;
}

+ (CXProviderConfiguration *)getProviderConfiguration:(NSDictionary *)settings {
#ifdef DEBUG
  NSLog(@"[Settings][getProviderConfiguration]");
#endif
  CXProviderConfiguration *providerConfiguration = [[CXProviderConfiguration alloc] init];
  providerConfiguration.supportsVideo = YES;
  providerConfiguration.maximumCallGroups = 1;
  providerConfiguration.maximumCallsPerCallGroup = 1;
  providerConfiguration.supportedHandleTypes = [Settings getSupportedHandleTypes:settings[@"handleType"]];
  
  if (settings[@"supportsVideo"]) {
    providerConfiguration.supportsVideo = [settings[@"supportsVideo"] boolValue];
  }
  if (settings[@"maximumCallGroups"]) {
    providerConfiguration.maximumCallGroups = [settings[@"maximumCallGroups"] integerValue];
  }
  if (settings[@"maximumCallsPerCallGroup"]) {
    providerConfiguration.maximumCallsPerCallGroup = [settings[@"maximumCallsPerCallGroup"] integerValue];
  }
  NSString *imageName = settings[@"imageName"];
  if ([imageName isKindOfClass:[NSString class]] && imageName.length > 0) {
    providerConfiguration.iconTemplateImageData = UIImagePNGRepresentation([UIImage imageNamed:imageName]);
  }
  NSString *ringtoneSound = settings[@"ringtoneSound"];
  if ([ringtoneSound isKindOfClass:[NSString class]] && ringtoneSound.length > 0) {
    providerConfiguration.ringtoneSound = ringtoneSound;
  }
  if (@available(iOS 11.0, *)) {
    if (settings[@"includesCallsInRecents"]) {
      providerConfiguration.includesCallsInRecents = [settings[@"includesCallsInRecents"] boolValue];
    }
  }
  return providerConfiguration;
}

+ (NSSet *)getSupportedHandleTypes:(id)handleType {
  if (handleType) {
    if ([handleType isKindOfClass:[NSArray class]]) {
      NSSet *types = [NSSet set];

      for (NSString *type in handleType) {
        types = [types setByAddingObject: [NSNumber numberWithInteger:[Settings getHandleType:type]]];
      }

      return types;
    } else {
      CXHandleType _handleType = [Settings getHandleType:handleType];

      return [NSSet setWithObjects:[NSNumber numberWithInteger:_handleType], nil];
    }
  } else {
    return [NSSet setWithObjects:[NSNumber numberWithInteger:CXHandleTypePhoneNumber], nil];
  }
}

+ (CXHandleType)getHandleType:(NSString *)handleType {
  if ([handleType isEqualToString:@"generic"]) {
    return CXHandleTypeGeneric;
  } else if ([handleType isEqualToString:@"number"]) {
    return CXHandleTypePhoneNumber;
  } else if ([handleType isEqualToString:@"phone"]) {
    return CXHandleTypePhoneNumber;
  } else if ([handleType isEqualToString:@"email"]) {
    return CXHandleTypeEmailAddress;
  } else {
    return CXHandleTypeGeneric;
  }
}

@end
