//
//  DeviceState.m
//  StreamVideoReactNative
//
//  Created by Kristian Martinoski on 3.12.24.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface
RCT_EXTERN_MODULE(DeviceState, RCTEventEmitter)
RCT_EXTERN_METHOD(isLowPowerModeEnabled:
                  (RCTPromiseResolveBlock) resolve
                  reject:(RCTPromiseRejectBlock) reject)
RCT_EXTERN_METHOD(currentThermalState:
                  (RCTPromiseResolveBlock) resolve
                  reject:(RCTPromiseRejectBlock) reject)

@end
